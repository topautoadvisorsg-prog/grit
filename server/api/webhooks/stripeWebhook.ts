import { Router, Express } from 'express';
import express from 'express';
import { stripeService } from '../../services/stripeService';
import { logger } from '../../utils/logger';
import { db } from '../../db';
import { users } from '../../../shared/models/auth';
import { eq } from 'drizzle-orm';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export function registerStripeWebhook(app: Express): void {
    // We need the raw body for signature verification
    app.post(
        '/api/webhooks/stripe',
        express.raw({ type: 'application/json' }),
        async (req, res) => {
            const signature = req.headers['stripe-signature'] as string;

            if (!webhookSecret) {
                logger.error('STRIPE_WEBHOOK_SECRET is not set. Webhook verification skipped (UNSAFE).');
                return res.status(500).json({ error: 'Webhook secret not configured' });
            }

            if (!signature) {
                return res.status(400).json({ error: 'No signature provided' });
            }

            let event;

            try {
                event = stripeService.constructEvent(req.body, signature, webhookSecret);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                logger.error(`Webhook signature verification failed: ${message}`);
                return res.status(400).send(`Webhook Error: ${message}`);
            }

            // Handle the event
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object as any;
                    const userId = session.metadata?.userId;

                    if (userId) {
                        logger.info(`Fulfilling checkout session for user: ${userId}`);
                        try {
                            await db.update(users)
                                .set({ tier: 'premium' })
                                .where(eq(users.id, userId));
                            logger.info(`Successfully upgraded user ${userId} to premium`);
                        } catch (err) {
                            logger.error(`Failed to update user tier in database: ${err}`);
                        }
                    } else {
                        logger.warn('Checkout session completed but no userId found in metadata');
                    }
                    break;
                }
                case 'payment_intent.succeeded': {
                    const intent = event.data.object as any;
                    logger.info(`Payment intent succeeded: ${intent.id}`);
                    // Additional logging or tracking could go here
                    break;
                }
                default:
                    logger.info(`Unhandled event type: ${event.type}`);
            }

            res.status(200).json({ received: true });
        }
    );
}

import Stripe from 'stripe';
import { logger } from '../utils/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
    logger.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will be limited.');
}

const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-01-27.acacia', // Using the latest or most stable version
});

export const stripeService = {
    /**
     * Creates a Stripe Checkout Session for a payment.
     * @param userId The ID of the user making the purchase.
     * @param priceId The Stripe Price ID for the item.
     * @param successUrl Redirect URL on successful payment.
     * @param cancelUrl Redirect URL on cancelled payment.
     */
    async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string) {
        try {
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId,
                },
            });

            return session;
        } catch (error) {
            logger.error('Error creating Stripe checkout session:', error);
            throw error;
        }
    },

    /**
     * Verifies a webhook signature and returns the event.
     * @param payload Raw body of the request.
     * @param signature Stripe-Signature header.
     * @param webhookSecret Stripe Webhook Endpoint Secret.
     */
    constructEvent(payload: string | Buffer, signature: string, webhookSecret: string) {
        return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    },
};

export default stripe;

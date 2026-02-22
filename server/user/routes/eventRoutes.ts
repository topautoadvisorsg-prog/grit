import type { Express, Request, Response } from "express";
import { isAuthenticated } from '../../auth/replitAuth';
import { storage } from "../../storage";
import { insertEventSchema, insertEventFightSchema, CARD_PLACEMENTS } from "../../../shared/schema";
import { v4 as uuidv4 } from "uuid";
import { logger } from '../../utils/logger';
import { parsePagination, paginatedResponse } from '../../utils/pagination';

interface CreateEventRequest {
  name: string;
  date: string;
  venue: string;
  city: string;
  state?: string;
  country: string;
  organization: string;
  description?: string;
  fights: {
    fighter1Id: string;
    fighter2Id: string;
    cardPlacement: string;
    boutOrder: number;
    weightClass: string;
    isTitleFight: boolean;
    rounds: number;
  }[];
}

export function registerEventRoutes(app: Express) {
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = events.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, events.length, params));
      }
      res.json(events);
    } catch (error) {
      logger.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/completed", async (req: Request, res: Response) => {
    try {
      const events = await storage.getAllEvents();
      const completedEvents = events.filter(e => e.status === 'Completed');
      const eventsWithFights = await Promise.all(
        completedEvents.map(async (event) => {
          const fights = await storage.getEventFights(event.id);
          return { ...event, fights };
        })
      );
      if (req.query.page) {
        const params = parsePagination(req);
        const paginated = eventsWithFights.slice(params.offset, params.offset + params.limit);
        return res.json(paginatedResponse(paginated, eventsWithFights.length, params));
      }
      res.json(eventsWithFights);
    } catch (error) {
      logger.error("Error fetching completed events:", error);
      res.status(500).json({ error: "Failed to fetch completed events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id as string);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      const fights = await storage.getEventFights(req.params.id as string);
      res.json({ ...event, fights });
    } catch (error) {
      logger.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const body = req.body as CreateEventRequest;

      const eventValidation = insertEventSchema.safeParse({
        name: body.name,
        date: body.date,
        venue: body.venue,
        city: body.city,
        state: body.state,
        country: body.country,
        organization: body.organization,
        description: body.description,
      });

      if (!eventValidation.success) {
        return res.status(400).json({
          error: "Invalid event data",
          details: (eventValidation.error as any).errors,
        });
      }

      if (!body.fights || body.fights.length === 0) {
        return res.status(400).json({ error: "Event must have at least one fight" });
      }

      for (const fight of body.fights) {
        if (!CARD_PLACEMENTS.includes(fight.cardPlacement as any)) {
          return res.status(400).json({
            error: `Invalid card placement: ${fight.cardPlacement}. Must be one of: ${CARD_PLACEMENTS.join(", ")}`,
          });
        }
        const fighter1 = await storage.getFighter(fight.fighter1Id);
        const fighter2 = await storage.getFighter(fight.fighter2Id);
        if (!fighter1 || !fighter2) {
          return res.status(400).json({ error: "One or more fighters not found" });
        }
        if (fight.fighter1Id === fight.fighter2Id) {
          return res.status(400).json({ error: "Fighter cannot fight themselves" });
        }
      }

      const eventId = uuidv4();
      const createdEvent = await storage.createEvent({
        ...eventValidation.data,
        id: eventId,
        createdAt: new Date(),
      });

      const fightsToCreate = body.fights.map((fight) => ({
        id: uuidv4(),
        eventId,
        fighter1Id: fight.fighter1Id,
        fighter2Id: fight.fighter2Id,
        cardPlacement: fight.cardPlacement,
        boutOrder: fight.boutOrder,
        weightClass: fight.weightClass,
        isTitleFight: fight.isTitleFight,
        rounds: fight.rounds,
      }));

      const createdFights = await storage.createEventFights(fightsToCreate);

      res.status(201).json({
        ...createdEvent,
        fights: createdFights,
      });
    } catch (error) {
      logger.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
}

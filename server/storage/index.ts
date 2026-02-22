
import { FighterStorage, IFighterStorage } from "./fighter";
import { EventStorage, IEventStorage } from "./event";
import { UserStorage, IUserStorage } from "./user";
import { NewsStorage, INewsStorage } from "./news";
import { StatsStorage, IStatsStorage } from "./stats";
import { PickStorage, IPickStorage } from "./picks";

// Aggregate interface
export interface IStorage extends IFighterStorage, IEventStorage, IUserStorage, INewsStorage, IStatsStorage, IPickStorage { }

// Aggregate implementation (Mix-in or Delegate)
class DatabaseStorage implements IStorage {
    private fighterStorage = new FighterStorage();
    private eventStorage = new EventStorage();
    private userStorage = new UserStorage();
    private newsStorage = new NewsStorage();
    private statsStorage = new StatsStorage();
    private pickStorage = new PickStorage();

    // Fighters
    getAllFighters = this.fighterStorage.getAllFighters.bind(this.fighterStorage);
    getFighter = this.fighterStorage.getFighter.bind(this.fighterStorage);
    createFighter = this.fighterStorage.createFighter.bind(this.fighterStorage);
    updateFighter = this.fighterStorage.updateFighter.bind(this.fighterStorage);
    deleteFighter = this.fighterStorage.deleteFighter.bind(this.fighterStorage);
    getAllFightHistory = this.fighterStorage.getAllFightHistory.bind(this.fighterStorage);
    getFightHistoryByFighter = this.fighterStorage.getFightHistoryByFighter.bind(this.fighterStorage);
    createFightHistory = this.fighterStorage.createFightHistory.bind(this.fighterStorage);
    updateFightHistory = this.fighterStorage.updateFightHistory.bind(this.fighterStorage);
    deleteFightHistoryRecord = this.fighterStorage.deleteFightHistoryRecord.bind(this.fighterStorage);
    deleteFightHistoryByFighter = this.fighterStorage.deleteFightHistoryByFighter.bind(this.fighterStorage);
    linkUnlinkedFightHistory = this.fighterStorage.linkUnlinkedFightHistory.bind(this.fighterStorage);

    // Events
    getAllEvents = this.eventStorage.getAllEvents.bind(this.eventStorage);
    getEvent = this.eventStorage.getEvent.bind(this.eventStorage);
    createEvent = this.eventStorage.createEvent.bind(this.eventStorage);
    updateEvent = this.eventStorage.updateEvent.bind(this.eventStorage);
    deleteEvent = this.eventStorage.deleteEvent.bind(this.eventStorage);
    deleteEventFights = this.eventStorage.deleteEventFights.bind(this.eventStorage);
    getEventFights = this.eventStorage.getEventFights.bind(this.eventStorage);
    createEventFight = this.eventStorage.createEventFight.bind(this.eventStorage);
    createEventFights = this.eventStorage.createEventFights.bind(this.eventStorage);
    updateEventFight = this.eventStorage.updateEventFight.bind(this.eventStorage);
    deleteEventFight = this.eventStorage.deleteEventFight.bind(this.eventStorage);

    // Users
    getUser = this.userStorage.getUser.bind(this.userStorage);
    upsertUser = this.userStorage.upsertUser.bind(this.userStorage);

    // News
    getAllNewsArticles = this.newsStorage.getAllNewsArticles.bind(this.newsStorage);
    getPublishedNewsArticles = this.newsStorage.getPublishedNewsArticles.bind(this.newsStorage);
    getNewsArticle = this.newsStorage.getNewsArticle.bind(this.newsStorage);
    createNewsArticle = this.newsStorage.createNewsArticle.bind(this.newsStorage);
    updateNewsArticle = this.newsStorage.updateNewsArticle.bind(this.newsStorage);
    deleteNewsArticle = this.newsStorage.deleteNewsArticle.bind(this.newsStorage);
    getNewsArticlesByFighter = this.newsStorage.getNewsArticlesByFighter.bind(this.newsStorage);

    // Stats
    createFightTotals = this.statsStorage.createFightTotals.bind(this.statsStorage);
    deleteFightTotals = this.statsStorage.deleteFightTotals.bind(this.statsStorage);
    createRoundStats = this.statsStorage.createRoundStats.bind(this.statsStorage);
    deleteRoundStats = this.statsStorage.deleteRoundStats.bind(this.statsStorage);

    // Picks
    lockPicksForEvent = this.pickStorage.lockPicksForEvent.bind(this.pickStorage);
    scoreEventPicks = this.pickStorage.scoreEventPicks.bind(this.pickStorage);
}

export const storage = new DatabaseStorage();

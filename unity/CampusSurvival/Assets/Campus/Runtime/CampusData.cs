using System;
using System.Collections.Generic;
using System.Linq;

namespace CampusSurvival
{
    [Serializable] public class WorldData
    {
        public Building[] buildings = new Building[0];
        public Lesson[] lessons = new Lesson[0];
        public Post[] posts = new Post[0];
    }
    [Serializable] public class Building { public string id, name, entry; public bool outdoor; public Room[] rooms = new Room[0]; }
    [Serializable] public class Room { public string id, name, floor, text; }
    [Serializable] public class Lesson
    {
        public string id, person, name, location, room, topic;
        public int day, start, end;
        public LessonChoice[] choices = new LessonChoice[0];
        public string Key { get { return day + ":" + person + ":" + id; } }
    }
    [Serializable] public class LessonChoice { public string id, label, text; }
    [Serializable] public class Post
    {
        public string id, board, title, body, club, kind;
        public int day, minute;
        public bool read;
        public string[] comments = new string[0];
    }
    [Serializable] public class Actor
    {
        public string id, name, silhouette, major;
        public bool met, named, seniorityKnown;
        public int familiarity, affection, trust, tension, fatigue, lastTalk = -999;
        public List<string> memories = new List<string>();
        public List<string> recentLines = new List<string>();
        public Actor() { }
        public Actor(string id, string name, string silhouette, string major)
        { this.id = id; this.name = name; this.silhouette = silhouette; this.major = major; }
    }
    [Serializable] public class Appointment
    {
        public string id, person, location, label, kind = "meeting", status = "offered", outcome = "";
        public int day, minute, duration = 20, progress;
    }
    [Serializable] public class ClubApplication
    {
        public string id, status = "submitted";
        public int submittedAt, finishedAt, step, honesty;
    }
    [Serializable] public class PeerLink { public string first, second; public int trust, tension; }
    [Serializable] public class Entry { public string id, text; public int day, minute; }
    [Serializable] public class CafeOrder
    { public string item, temperature, status = "draft"; public int price, day, readyAt; }
    [Serializable] public class ActivityState
    {
        public string id, location, room, role = "", approach = "", status = "active";
        public int day, step, score, hits, attempts, elapsedMs, phase, duration, spentMinutes, startedAt, lastHitMs = -1000;
        public bool assisted;
        public List<string> witnesses = new List<string>();
    }
    [Serializable] public class SupplyState
    {
        public bool resolved, attended, finished;
        public int step, burden, teamwork;
        public string outcome = "";
        public List<string> witnesses = new List<string>();
        public List<string> present = new List<string>();
    }
    [Serializable] public class CampusState
    {
        public int version = 1, day = 1, minute = 540, seed = 197609, worldSeed = 197609;
        public string location = "arts", room = "", screen = "place", person = "", focus = "", narrative = "", speaker = "김태이";
        public string returnScreen = "place";
        public int playerStrain;
        public int dialogueStep, spent, beat, choicePage, communityTick = -1, lastRandomAt = -1000;
        public string randomEvent = "", pendingOutcome = "";
        public bool ended, umbrella;
        public CafeOrder order;
        public ActivityState activity;
        public SupplyState supply = new SupplyState();
        public List<PeerLink> peers = new List<PeerLink>();
        public List<Actor> actors = new List<Actor>();
        public List<Appointment> appointments = new List<Appointment>();
        public List<ClubApplication> clubs = new List<ClubApplication>();
        public List<Entry> attendance = new List<Entry>();
        public List<Entry> knowledge = new List<Entry>();
        public List<Entry> inventory = new List<Entry>();
        public List<Entry> journal = new List<Entry>();
        public List<Entry> messages = new List<Entry>();
        public List<Post> feed = new List<Post>();
        public List<string> npcClasses = new List<string>();
        public List<string> pace = new List<string>();
        public List<string> completed = new List<string>();
    }
    public class GameAction
    {
        public readonly string id, arg, label;
        public GameAction(string id, string label, string arg = "") { this.id = id; this.label = label; this.arg = arg; }
    }
    public class GameView
    {
        public string title, text, speaker, portrait, art = "Campus";
        public List<GameAction> utilityActions = new List<GameAction>();
        public bool menu;
        public List<GameAction> actions = new List<GameAction>();
        public void Add(string id, string label, string arg = "") { actions.Add(new GameAction(id, label, arg)); }
    }
}

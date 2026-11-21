const t = require("node:test"),
  a = require("node:assert/strict"),
  fs = require("node:fs/promises"),
  path = require("node:path"),
  os = require("node:os");
const Roles = require("../ui/roles/model.js"),
  { StoryDirector, initial } = require("../electron/story-director.cjs"),
  { createCombat } = require("../ui/story/combat.js");
t(
  "all12 roles have distinct local original SVGs; slayer is confirmed and retired categories do not become roles",
  async () => {
    a.equal(Roles.records.length, 12);
    const images = new Set();
    for (const role of Roles.records) {
      const svg = await fs.readFile(
        path.join(__dirname, "../ui/roles/icons", role.icon),
        "utf8",
      );
      a.match(svg, /<svg /);
      a(!/<script|https?:\/\/(?!www.w3.org)/.test(svg));
      images.add(svg);
    }
    a.equal(images.size, 12);
    a.equal(Roles.get("slayer").name, "슬레이어");
    for (const id of [
      "assassin",
      "shielder",
      "cleanser",
      "controller",
      "porter",
    ])
      a.equal(Roles.get(id), null);
    a.match(Roles.get("thief").description, /기점/);
  },
);
t(
  "assignment supports multiple roles without skill/stat/equipment changes or automatic party joins",
  () => {
    const s = { ...initial(), party: ["yeogyeong"] };
    const n = Roles.assign(s, "taei", ["slayer", "thief", "slayer"]);
    a.deepEqual(n.roleAssignments.taei, ["slayer", "thief"]);
    a.deepEqual(n.player, s.player);
    a.deepEqual(n.skillBook, s.skillBook);
    a.deepEqual(n.party, s.party);
    a.equal(s.roleAssignments, undefined);
    a.throws(() => Roles.assign(s, "dogyeom", ["tank"]));
    a.throws(() => Roles.assign(s, "taei", ["fake"]));
    a.deepEqual(Roles.normalize(["supporter", "healer", "buffer"]), [
      "healer",
      "buffer",
    ]);
    a.deepEqual(Roles.assign(n, "taei", []).roleAssignments, {});
    a.deepEqual(
      Roles.visible({
        ...n,
        roleAssignments: { ...n.roleAssignments, dogyeom: ["bruiser"] },
      }),
      { taei: ["slayer", "thief"] },
    );
  },
);
t(
  "real role assignment saves atomically, checks revision/membership and cannot inject stats",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roles-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {});
      const req = {
        revision: 0,
        requestId: "roles-first-request",
        actorId: "taei",
        roles: ["slayer"],
      };
      const s = await d.assignRoles(req);
      a.deepEqual(s.roleAssignments, { taei: ["slayer"] });
      a.equal(s.revision, 1);
      a.deepEqual((await d.read()).roleAssignments, s.roleAssignments);
      a.deepEqual(
        (await d.assignRoles(req)).roleAssignments,
        s.roleAssignments,
      );
      const before = await fs.readFile(d.file, "utf8");
      await a.rejects(
        d.assignRoles({
          ...req,
          requestId: "roles-fake-member",
          revision: 1,
          actorId: "dogyeom",
        }),
      );
      await a.rejects(
        d.assignRoles({
          ...req,
          requestId: "roles-fake-stats",
          revision: 1,
          stats: { strength: 100 },
        }),
      );
      await a.rejects(
        d.assignRoles({ ...req, requestId: "roles-stale-state" }),
      );
      a.equal(await fs.readFile(d.file, "utf8"), before);
      a.deepEqual(s.player, initial().player);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "realtime handoff carries assigned positions only for actual party members; active combat locks editing",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roles-battle-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {}),
        s = {
          ...initial(),
          era: "fantasy",
          location: "north-city-01",
          party: ["yeogyeong"],
          roleAssignments: {
            taei: ["slayer"],
            yeogyeong: ["healer"],
            dogyeom: ["bruiser"],
          },
          combat: createCombat(["goblin"], "realtime", "test"),
        };
      await d.save(s);
      await a.rejects(
        d.assignRoles({
          revision: 0,
          requestId: "roles-during-fight",
          actorId: "taei",
          roles: ["tank"],
        }),
      );
      const h = await d.realtimeStart(0);
      a.deepEqual(h.party, ["yeogyeong"]);
      a.deepEqual(h.roleAssignments, {
        taei: ["slayer"],
        yeogyeong: ["healer"],
      });
      await a.rejects(
        d.assignRoles({
          revision: 0,
          requestId: "roles-active-token",
          actorId: "taei",
          roles: [],
        }),
      );
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);
t(
  "unknown roles in a saved file are rejected and the original file is preserved",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "roles-bad-save-"));
    try {
      const d = new StoryDirector(path.join(dir, "story.json"), {}),
        s = { ...initial(), roleAssignments: { taei: ["bogus"] } };
      await d.save(s);
      const before = await fs.readFile(d.file, "utf8");
      await a.rejects(d.read(), /원본/);
      a.equal(await fs.readFile(d.file, "utf8"), before);
    } finally {
      await fs.rm(dir, { recursive: true });
    }
  },
);

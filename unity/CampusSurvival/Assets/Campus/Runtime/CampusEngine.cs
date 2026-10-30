using System;
using System.Collections.Generic;
using System.Linq;

namespace CampusSurvival
{
    // Pure C#: no Unity reference. Rendering and disk I/O cannot mutate simulation time.
    public sealed class CampusEngine
    {
        public readonly WorldData World;
        public CampusState S { get; private set; }
        public CampusEngine(WorldData world, CampusState state = null, int seed = 197609)
        {
            World = world ?? throw new ArgumentNullException(nameof(world));
            S = state ?? new CampusState();
            if (state == null)
            {
                S.seed = S.worldSeed = seed == 0 ? 197609 : seed;
                S.actors.Add(new Actor("yeogyeong", "차여경", "복슬한 머리의 학생", "간호학과"));
                S.actors.Add(new Actor("seoyeon", "한서연", "단발머리 학생", "치위생과"));
                S.actors.Add(new Actor("soyul", "박소율", "긴 머리의 학생", "치위생과"));
                S.peers.Add(new PeerLink { first = "seoyeon", second = "soyul", trust = 3 });
                S.narrative = "복학 첫날. 문 너머에서 반주를 맞추는 소리가 새어 나온다. 휴대폰 시간표부터 확인할까.";
                Journal("등교", "예술동에서 복학 첫날을 시작했다.");
                TickCommunity();
            }
            if (S.version != 1 || S.day < 1 || S.day > 3 || S.minute < 540 || S.minute > 1320 || S.actors.Count != 3)
                throw new ArgumentException("지원하지 않거나 손상된 Unity 저장입니다.");
        }
        public static string Clock(int minute) { return (minute / 60).ToString("00") + ":" + (minute % 60).ToString("00"); }
        public string Weather { get { return S.day == 2 ? "비 · 18°C" : S.day == 3 ? "흐림 · 20°C" : "맑음 · 22°C"; } }
        public string PlaceName(string id) { var b = World.buildings.FirstOrDefault(x => x.id == id); return b == null ? id : b.name; }
        public string Name(Actor a) { return a.named ? a.name : a.silhouette; }
        Actor Person(string id) { return S.actors.First(x => x.id == id); }
        public IEnumerable<Lesson> Lessons(string person = "taei", int day = 0) { return World.lessons.Where(x => x.person == person && x.day == (day == 0 ? S.day : day)).OrderBy(x => x.start); }
        public string RoomName(string location, string id)
        { var b = World.buildings.FirstOrDefault(x => x.id == location); var r = b == null ? null : b.rooms.FirstOrDefault(x => x.id == id); return r == null ? "입구" : r.name; }
        public string LocationOf(Actor actor)
        {
            var lesson = Lessons(actor.id).FirstOrDefault(x => S.minute >= x.start - 30 && S.minute < x.end);
            if (lesson != null) return lesson.location;
            var meeting = S.appointments.FirstOrDefault(x => x.person == actor.id && x.day == S.day && x.status == "pending" && S.minute >= x.minute - 15 && S.minute <= x.minute + 40);
            if (meeting != null) return meeting.location;
            if (S.day == 1 && S.minute >= (actor.id == "soyul" ? 810 : 780) && S.minute < (actor.id == "yeogyeong" ? 960 : actor.id == "seoyeon" ? 900 : 840)) return "hall";
            if (S.day == 2 && S.minute >= 790 && S.minute < 840 && S.peers.Any(x => x.first == "seoyeon" && x.second == "soyul" && x.trust >= 3 && x.tension < 3) && actor.id != "yeogyeong") return "library";
            string[] places = actor.id == "yeogyeong" ? new[] { "creative", "hall", "cafeteria", "library" } : actor.id == "seoyeon" ? new[] { "sculpture", "cafe", "library", "academic" } : new[] { "sculpture", "library", "creative", "cafe" };
            int offset = actor.id == "yeogyeong" ? 0 : actor.id == "seoyeon" ? 1 : 2;
            return places[(S.minute / 60 + S.day + offset + (S.worldSeed & 3)) % places.Length];
        }
        public bool Available(Actor a, int duration = 0)
        {
            return !Lessons(a.id).Any(x => S.minute < x.end && S.minute + duration >= x.start - 15) && S.minute + duration <= 1320;
        }
        public string RoomOf(Actor actor)
        {
            var lesson = Lessons(actor.id).FirstOrDefault(x => S.minute >= x.start - 30 && S.minute < x.end);
            if (lesson != null) return lesson.room;
            switch (LocationOf(actor))
            {
                case "hall": return "clubs";
                case "creative": return "library";
                case "sculpture": return "facilities";
                case "gym": return "fitness";
                case "arts": return "band";
                case "music": return "medium";
                case "cafeteria": return "dining";
                default: return "";
            }
        }
        public IEnumerable<Actor> Present()
        {
            // The entry permits a passing encounter; specific rooms never expose every person in the building.
            return S.actors.Where(a => LocationOf(a) == S.location && (S.room == "" || RoomOf(a) == S.room));
        }
        int Random(int max)
        { unchecked { uint v = (uint)S.seed; v ^= v << 13; v ^= v >> 17; v ^= v << 5; S.seed = (int)v; return (int)(v % (uint)max); } }
        string Pick(params string[] lines) { return lines[Random(lines.Length)]; }
        int Absolute { get { return S.day * 1440 + S.minute; } }
        void Journal(string id, string text) { S.journal.Add(new Entry { id = id, text = text, day = S.day, minute = S.minute }); }
        void Know(string id, string text)
        { if (S.knowledge.Any(x => x.id == id)) return; S.knowledge.Add(new Entry { id = id, text = text, day = S.day, minute = S.minute }); Journal("발견", text); }
        void Message(string id, string text) { S.messages.Add(new Entry { id = id, text = text, day = S.day, minute = S.minute }); }
        void Say(string text, string speaker = "김태이") { S.narrative = text; S.speaker = speaker; S.beat = 0; S.choicePage = 0; }
        void Pace(string key)
        {
            if (!S.pace.Contains(key)) S.pace.Add(key);
            if (S.pace.Count >= 3) { S.pace.Clear(); int minutes = S.day == 2 && !S.umbrella && (key.StartsWith("move:") || World.buildings.First(x => x.id == S.location).outdoor) ? 40 : 30; Advance(Math.Min(minutes, 1320 - S.minute)); }
        }
        public void Advance(int minutes)
        {
            if (minutes < 0 || S.minute + minutes > 1320) throw new InvalidOperationException("오늘 남은 시간이 부족합니다.");
            S.minute += minutes;
            foreach (var p in S.actors)
                foreach (var c in Lessons(p.id).Where(x => x.end <= S.minute && !S.npcClasses.Contains(x.Key)))
                { S.npcClasses.Add(c.Key); p.fatigue++; }
            foreach (var c in Lessons().Where(x => x.end <= S.minute && !S.attendance.Any(r => r.id == x.Key)))
                S.attendance.Add(new Entry { id = c.Key, text = c.name + " · 결석", day = S.day, minute = c.end });
            foreach (var a in S.appointments.Where(x => x.day == S.day && (x.status == "pending" || x.status == "offered") && S.minute > x.minute + 40))
            {
                bool broken = a.status == "pending";
                a.status = broken ? "broken" : "expired";
                if (broken) { var p = Person(a.person); p.trust--; p.tension++; Journal("약속", a.label + " 약속을 지키지 못했다."); }
            }
            foreach (var c in S.clubs.Where(x => x.status == "reviewing" && Absolute - x.finishedAt >= 30))
            { c.status = c.honesty < 0 ? "declined" : "offered"; Message("club:" + c.id, ClubName(c.id) + (c.status == "offered" ? ": 면접 결과를 확인해주세요. 가입 여부는 직접 결정할 수 있습니다." : ": 이번에는 일정과 역할을 맞추기 어렵겠습니다. 공개 체험은 가능합니다.")); }
            if (S.day == 1 && S.minute >= 960 && !S.supply.resolved) ResolveSupply();
            if (S.day == 3 && S.minute >= 780 && !S.feed.Any(x => x.id == "warning-generated"))
                S.feed.Add(new Post { id = "warning-generated", day = 3, minute = S.minute, board = "자유", title = "정류장에 구급차 와 있던데", body = "직접 본 건 구급차뿐이에요. 이유는 못 들었어요. 확인 안 된 얘기는 퍼뜨리지 말자.", kind = "anonymous" });
            TickCommunity();
        }
        void Spend(int minutes) { Advance(minutes); S.pace.Clear(); }
        void TickCommunity()
        {
            int tick = (S.day - 1) * 24 + S.minute / 60;
            if (S.communityTick == tick) return;
            S.communityTick = tick;
            string[] titles = S.day == 2 ? new[] { "우산 두고 온 사람…", "비 와서 운동장 훈련 실내로 바뀜", "도서관 창가 빗소리 좋다" } : new[] { "오늘 학식 줄 어느 정도예요?", "연습실 앞에 물병 두고 가신 분", "공강 한 시간 뭐 하지" };
            S.feed.Add(new Post { id = "local:" + tick, day = S.day, minute = S.minute, board = "자유", title = titles[Random(titles.Length)], body = Pick("조금 전에 지나가면서 본 거라 지금은 다를 수도 있어요.", "혹시 근처인 사람 있으면 상황 좀 알려주세요.", "수업 끝나고 다시 확인해볼게요."), comments = new[] { "시간 지나면 바뀌니까 직접 확인하는 게 좋을 듯", "알려줘서 고마워요" } });
            if (S.feed.Count > 48) S.feed.RemoveAt(0);
        }
        bool TimeFor(int duration) { return !S.ended && S.minute + duration <= 1320; }
        bool ActivityOpen { get { return S.minute >= 540 && S.minute < 1080; } }
        Appointment LocalMeeting { get { return S.appointments.FirstOrDefault(x => x.status == "pending" && x.day == S.day && x.location == S.location && S.minute >= x.minute - 15 && S.minute <= x.minute + 15 && Present().Any(p => p.id == x.person) && TimeFor(20 - x.progress * 10)); } }

        public GameView View()
        {
            var v = new GameView { title = PlaceName(S.location) + (S.room == "" ? "" : " · " + RoomName(S.location, S.room)), text = S.narrative, speaker = S.speaker, portrait = S.person };
            if (S.screen == "place")
            {
                v.portrait = "";
                if (S.ended) { v.title = "3일간의 기록"; v.text = "일상에서 알게 된 사람과 정보가 남았다. 이 Unity 이식판은 이상징후를 확인하는 3일차까지다. 좀비 전투와 탈출은 아직 구현되지 않았다."; v.Add("menu", "기록과 저장 보기"); return v; }
                if (S.minute >= 1320) { v.text = "오늘은 늦었다. 남은 일은 정리하고 자취방으로 돌아가자."; v.Add("home", "귀가한다."); return v; }
                if (S.randomEvent != "")
                { v.text = S.randomEvent == "paper" ? "열린 창문으로 바람이 들어와 종이가 바닥에 흩어진다. 근처 학생이 양손에 짐을 든 채 멈춰 선다." : "복도 모퉁이에서 상자를 든 학생과 동선이 겹친다. 뒤에서는 누군가 급하게 걸어온다."; v.Add("random", "잠깐 멈춰서 함께 정리한다.", "help"); v.Add("random", "옆으로 비켜 통로를 내준다.", "space"); return v; }
                var c = Lessons().FirstOrDefault(x => S.minute >= x.start - 15 && S.minute < x.end && S.location == x.location && S.room == x.room && !S.attendance.Any(r => r.id == x.Key));
                if (c != null) v.Add("class", c.name + " 수업에 들어간다.", c.Key);
                if (LocalMeeting != null) v.Add("meeting", "약속 장소에서 잠깐 기다려본다.", LocalMeeting.id);
                v.Add("look", "주변을 살펴본다.");
                var building = World.buildings.First(x => x.id == S.location);
                if (building.rooms.Length > 0) v.Add("rooms", "건물 안에서 갈 곳을 찾는다.");
                if (Present().Any()) v.Add("encounter", "근처에서 들리는 말에 귀를 기울인다.");
                if (S.location == "cafe" || S.location == "cafeteria" && S.room == "cafe") v.Add("counter", "주문대로 간다.");
                if (S.location == "hall")
                {
                    v.Add("umbrella", S.umbrella ? "빌린 우산을 반납한다." : "공용 우산을 빌린다.");
                    foreach (var a in S.clubs.Where(x => x.status == "submitted" && Absolute - x.submittedAt >= 30 && S.minute >= 780 && S.minute <= 1000 && S.room == ClubRoom(x.id))) v.Add("interview", "모집 담당자에게 면접을 문의한다.", a.id);
                    if (S.day == 1 && S.minute >= 780 && S.minute <= 900 && !S.supply.finished && !S.supply.resolved) v.Add("supply", "물품 준비 중인 쪽에 말을 건다.");
                }
                AddActivities(v);
                if (TimeFor(15)) v.Add("rest", "잠깐 앉아서 쉰다. · 15분");
                if (TimeFor(15)) v.Add("wait", "이곳에서 조금 기다린다. · 15분");
                v.Add("travel", "다른 장소로 이동한다.");
                if (S.minute >= 1020) v.Add("home", "오늘은 귀가한다.");
            }
            else if (S.screen == "travel" || S.screen == "rooms")
            {
                v.menu = true; v.title = S.screen == "travel" ? "어디로 갈까" : "층별 안내"; v.text = "호실 배치는 게임용 제안입니다. 실제 학교의 안내도가 아닙니다.";
                if (S.screen == "travel") foreach (var b in World.buildings.Where(x => x.id != S.location && TimeFor(1))) v.Add("visit", b.name, b.id);
                else foreach (var r in World.buildings.First(x => x.id == S.location).rooms) v.Add("room", r.floor + " · " + r.name, r.id);
                v.Add("back", "돌아가기");
            }
            else if (S.screen == "encounter")
            {
                v.title = "스쳐 가는 사람들";
                foreach (var p in Present()) v.Add("talk", p.named ? Name(p) + " 쪽에 가볍게 인사한다." : p.silhouette + "에게 주변 상황을 묻는다.", p.id);
                v.Add("back", "방해하지 않고 지나간다.");
            }
            else if (S.screen == "dialogue")
            {
                var p = Person(S.person); v.title = Name(p); v.speaker = Name(p);
                if (LocationOf(p) != S.location || !Available(p)) v.Add("back", "붙잡지 않고 인사를 마친다.");
                else
                {
                    if (!p.named) v.Add("respond", "내 이름부터 말하며 인사한다.", "introduce");
                    if (S.dialogueStep == 0) { v.Add("respond", "방금 하던 일에 관해 묻는다.", "work"); v.Add("respond", "지금 잠깐 이야기해도 괜찮은지 묻는다.", "check"); }
                    else { v.Add("respond", "그 이야기에서 궁금한 점을 더 묻는다.", "follow"); v.Add("respond", "내 경험도 짧게 이야기한다.", "share"); }
                    if (p.tension > 0) v.Add("respond", "지난번 내 행동에 대해 이야기한다.", "repair");
                    if (p.named && S.day < 3 && !S.completed.Contains("invite:" + S.day + p.id)) v.Add("invite", "다음에 잠깐 함께할 시간을 묻는다.", p.id);
                    if (S.day >= 2 && S.supply.witnesses.Contains(p.id) && !p.memories.Any(x => x.StartsWith("followup:")) && Available(p, 20) && TimeFor(20)) v.Add("followup", "지난번 함께 일한 이야기를 꺼낸다.", p.id);
                    v.Add("back", "다음에 보자며 인사를 마친다.");
                }
            }
            else if (S.screen == "class")
            {
                var c = World.lessons.First(x => x.Key == S.focus); v.title = c.name; v.text = c.topic;
                foreach (var x in c.choices) v.Add("classChoice", x.label, x.id);
                v.Add("back", "아직 들어가지 않는다.");
            }
            else if (S.screen == "phone" || S.screen == "menu")
            {
                v.menu = true; v.title = S.screen == "phone" ? "휴대폰" : "캠퍼스 생활"; v.text = "창을 확인하는 동안 게임 시간은 흐르지 않습니다.";
                if (S.screen == "phone") { v.Add("community", "캠퍼스톡 · 학내 커뮤니티"); v.Add("messages", "메시지 · " + S.messages.Count + "건"); v.Add("appointments", "약속 · 제안과 일정"); v.Add("clubs", "동아리 · 모집과 신청"); }
                else { v.Add("travel", "이동 · 건물과 호실"); v.Add("timetable", "시간표 · 출석 기록"); v.Add("phone", "휴대폰"); v.Add("knowledge", "알게 된 정보"); v.Add("contacts", "만난 사람들"); v.Add("inventory", "소지품 · 지출 " + S.spent + "원"); v.Add("journal", "지난 기록"); }
                v.Add("back", "장면으로 돌아가기");
            }
            else if (S.screen == "community")
            {
                v.menu = true; v.title = "캠퍼스톡"; v.text = "익명글은 확인되지 않은 이야기일 수 있습니다. 글을 읽어도 현장에서 경험한 것으로 처리되지 않습니다.";
                foreach (var p in AllPosts().Reverse()) v.Add("post", (S.completed.Contains("post:" + p.id) ? "읽음 · " : "") + p.board + " | " + p.title, p.id);
                v.Add("phone", "휴대폰으로");
            }
            else if (S.screen == "post")
            {
                var p = AllPosts().First(x => x.id == S.focus); v.menu = true; v.title = p.title; v.text = p.body + "\n\n" + string.Join("\n", p.comments);
                if (!string.IsNullOrEmpty(p.club)) v.Add("clubs", "모집·신청 살펴보기");
                v.Add("community", "글 목록으로"); v.Add("back", "장면으로");
            }
            else if (S.screen == "timetable")
            {
                v.menu = true; v.title = "오늘의 시간표"; v.text = string.Join("\n\n", Lessons().Select(c => Clock(c.start) + "–" + Clock(c.end) + "  " + c.name + "\n" + PlaceName(c.location) + " · " + RoomName(c.location, c.room) + "\n" + (S.attendance.FirstOrDefault(x => x.id == c.Key)?.text ?? (S.minute >= c.end ? "결석" : "선택하여 이동할 수 있습니다."))));
                foreach (var c in Lessons().Where(c => S.minute < c.end)) v.Add("goClass", c.name + " 강의실로 이동", c.Key);
                v.Add("back", "돌아가기");
            }
            else if (S.screen == "appointments")
            {
                v.menu = true; v.title = "약속"; v.text = S.appointments.Count == 0 ? "아직 제안받거나 정한 약속이 없습니다." : "수락한 약속도 실제 현장에서 시간을 함께 보내야 이행됩니다.";
                foreach (var a in S.appointments)
                {
                    v.text += "\n\n" + a.day + "일차 " + Clock(a.minute) + " · " + a.label + "\n" + PlaceName(a.location) + " · " + Status(a.status);
                    if (a.status == "offered") { v.Add("accept", a.label + " · 수락", a.id); v.Add("decline", a.label + " · 정중히 거절", a.id); }
                    if (a.status == "pending") v.Add("cancel", a.label + " · 미리 취소 연락", a.id);
                }
                v.Add("phone", "휴대폰으로");
            }
            else if (S.screen == "clubs")
            {
                v.menu = true; v.title = "동아리 모집"; v.text = "신청 → 30분 뒤 자유관 현장 면접(13–17시) → 결과 확인 → 가입 결정. 공개 체험은 가입하지 않아도 가능합니다. 축구 선수는 남학생, 여성 부원은 매니저로 참여합니다.";
                foreach (string id in new[] { "volunteer", "football", "music" })
                {
                    var a = S.clubs.FirstOrDefault(x => x.id == id);
                    if (a == null) v.Add("apply", ClubName(id) + " · 지원서를 제출한다.", id);
                    else { v.text += "\n\n" + ClubName(id) + " · " + Status(a.status) + " · 자유관 " + ClubRoomNumber(id) + "호"; if (a.status == "offered") v.Add("join", ClubName(id) + " 가입 의사 전달", id); }
                }
                v.Add("phone", "휴대폰으로");
            }
            else if (S.screen == "interview")
            {
                var a = S.clubs.First(x => x.id == S.focus); v.title = ClubName(a.id) + " 면접";
                v.text = a.step == 0 ? "일정과 관심부터 맞춰볼게요. 어떤 활동을 해보고 싶어서 지원하셨어요?" : "수업이나 다른 일이 겹치면 어떻게 조율하고 싶으세요?";
                v.Add("interviewAnswer", a.step == 0 ? "아직 잘 모르지만 직접 참여하며 알아보고 싶다고 말한다." : "가능한 시간을 먼저 공유하고 맡은 일은 조정하겠다고 말한다.", "honest");
                v.Add("interviewAnswer", a.step == 0 ? "어떤 역할이든 내가 가장 잘할 거라고 말한다." : "다른 일정이 있어도 전부 참석할 수 있다고 장담한다.", "overpromise");
                v.Add("back", "면접을 잠시 멈춘다.");
            }
            else if (S.screen == "cafe")
            {
                v.art = "Cafe"; v.title = "주문대"; v.portrait = "";
                var o = S.order;
                if (o == null || o.status == "consumed") { v.text = "메뉴판을 살핀다. 직원이 주문을 기다린다."; v.Add("drink", "아메리카노 · 3,000원", "americano"); v.Add("drink", "카페라테 · 3,800원", "latte"); v.Add("drink", "차 · 3,500원", "tea"); }
                else if (o.status == "draft" && o.temperature == "") { v.text = "따뜻하게 드릴까요, 차갑게 드릴까요?"; v.Add("temperature", "따뜻하게", "hot"); v.Add("temperature", "차갑게", "iced"); }
                else if (o.status == "draft") { v.text = DrinkName(o.item) + " · " + (o.temperature == "hot" ? "따뜻하게" : "차갑게") + "\n" + o.price + "원. 아직 결제하지 않았다."; v.Add("pay", "카드로 결제한다."); v.Add("cancelOrder", "주문을 취소한다."); }
                else if (o.status == "paid") { v.text = S.minute >= o.readyAt ? "주문한 음료가 픽업대에 놓인다." : "직원이 음료를 준비하고 있다."; if (S.minute >= o.readyAt) v.Add("collect", "내 주문 번호를 확인하고 받는다."); else if (TimeFor(o.readyAt - S.minute)) v.Add("waitDrink", "음료가 나올 때까지 기다린다."); }
                else if (o.status == "collected") { v.text = "손에 든 음료에서 온기가 전해진다. 빈자리로 갈까."; v.Add("consume", "빈자리에 앉아 음료를 마신다."); }
                v.Add("back", "주문대에서 물러난다.");
            }
            else if (S.screen == "supply") SupplyView(v);
            else if (S.screen == "activity") ActivityView(v);
            else if (S.screen == "meeting") MeetingView(v);
            else if (S.screen == "home")
            { v.title = "학교 앞 자취방"; v.text = "가방을 내려놓는다. 오늘 있었던 일을 잠깐 되짚는다.\n\n" + string.Join("\n", S.journal.Where(x => x.day == S.day).Reverse().Take(4).Select(x => x.text)); v.Add("nextDay", S.day < 3 ? "쉬고 다음 날 등교한다." : "3일간의 기록을 마무리한다."); }
            else
            {
                v.menu = true;
                if (S.screen == "contacts") { v.title = "만난 사람들"; v.text = string.Join("\n\n", S.actors.Where(x => x.met).Select(x => Name(x) + "\n" + (x.named ? "인사를 나눈 사이" : "아직 이름을 모른다") + (x.tension > 2 ? " · 대화가 조심스럽다" : x.trust >= 3 ? " · 함께 맡긴 일이 있다" : ""))); }
                else { var list = S.screen == "knowledge" ? S.knowledge : S.screen == "inventory" ? S.inventory : S.screen == "messages" ? S.messages : S.journal; v.title = S.screen == "knowledge" ? "알게 된 정보" : S.screen == "inventory" ? "소지품" : S.screen == "messages" ? "메시지" : "지난 기록"; v.text = list.Count == 0 ? "아직 기록이 없습니다." : string.Join("\n\n", list.AsEnumerable().Reverse().Select(x => x.day + "일차 " + Clock(x.minute) + " · " + x.text)); }
                v.Add("back", "장면으로 돌아가기");
            }
            if (v.menu && !v.actions.Any(x => x.id == "back")) v.Add("back", "장면으로 돌아가기");
            return v;
        }
        public static string Status(string status)
        {
            switch (status) { case "offered": return "응답 대기"; case "pending": return "수락 · 예정"; case "kept": return "이행"; case "broken": return "미이행"; case "declined": return "거절"; case "expired": return "시간 지남"; case "cancelled": return "사전 취소"; case "submitted": return "접수 완료"; case "reviewing": return "면접 결과 대기"; case "accepted": return "가입 완료"; default: return status; }
        }
        static string ClubName(string id) { return id == "volunteer" ? "봉사단" : id == "football" ? "축구 동아리" : "음악 동아리"; }
        static string ClubRoom(string id) { return id == "volunteer" ? "clubs" : id == "football" ? "footballClub" : "musicClub"; }
        static string ClubRoomNumber(string id) { return id == "volunteer" ? "202" : id == "football" ? "201" : "203"; }
        static string DrinkName(string id) { return id == "americano" ? "아메리카노" : id == "latte" ? "카페라테" : "차"; }
        IEnumerable<Post> AllPosts() { return World.posts.Where(x => x.day <= S.day).Concat(S.feed); }
        public void OpenUtility(string screen)
        {
            if (screen != "menu" && screen != "phone") throw new ArgumentException("상단 메뉴에서 열 수 없는 화면입니다.");
            if (S.screen != "menu" && S.screen != "phone") S.returnScreen = S.screen;
            if (S.activity != null && S.activity.phase == 1) S.activity.phase = 2;
            S.screen = screen; S.beat = 0; S.choicePage = 0;
        }
        public void Dispatch(string id, string arg = "")
        {
            // Validate against current view: stale clicks cannot pay twice, duplicate rewards or accept expired offers.
            if (!View().actions.Any(x => x.id == id && x.arg == arg)) throw new InvalidOperationException("상황이 달라졌습니다. 현재 선택지를 확인해주세요.");
            S.choicePage = 0; S.beat = 0;
            if (new[] { "phone", "menu", "community", "appointments", "clubs", "messages", "knowledge", "contacts", "inventory", "journal", "timetable" }.Contains(id)) { S.screen = id; return; }
            switch (id)
            {
                case "back":
                    if (new[] { "menu", "phone", "community", "post", "appointments", "clubs", "messages", "knowledge", "contacts", "inventory", "journal", "timetable" }.Contains(S.screen)) { S.screen = S.returnScreen; S.returnScreen = "place"; }
                    else { S.screen = "place"; S.person = ""; }
                    break;
                case "travel": S.screen = "travel"; break;
                case "rooms": S.screen = "rooms"; break;
                case "visit":
                    if (!TimeFor(1)) throw new InvalidOperationException("오늘은 귀가할 시간입니다.");
                    S.location = arg; S.room = ""; S.person = ""; S.screen = "place"; S.returnScreen = "place";
                    Say(World.buildings.First(x => x.id == arg).entry); Pace("move:" + arg); break;
                case "room":
                    S.room = arg; S.screen = "place"; var room = World.buildings.First(x => x.id == S.location).rooms.First(x => x.id == arg);
                    Say(room.text); Know(S.location + ":" + arg, PlaceName(S.location) + " · " + room.floor + " " + room.name);
                    if (S.location == "creative" && arg == "library") { S.location = "library"; S.room = ""; }
                    Pace("room:" + S.location + ":" + arg); break;
                case "look":
                    Know("map:" + S.location, PlaceName(S.location) + " 입구와 돌아 나가는 길");
                    Say(Pick("출입문과 계단으로 이어지는 길을 눈으로 따라간다.", "오가는 사람을 피해 한쪽에 선다. 문 옆 안내가 눈에 들어온다.", "가방끈을 고쳐 멘다. 잠깐 멈추니 주변 소리가 들린다.") + (S.day == 2 ? " 밖에는 비가 내린다." : " 창밖으로 학생들이 지나간다."));
                    if (S.day == 3 && S.location == "headquarters") Know("warning:ambulance", "본부동 밖에서 구급차 소리를 직접 들었다. 원인은 모른다.");
                    Pace("look:" + S.location); MaybeRandom(); break;
                case "rest": Spend(15); foreach (var a in Present()) a.fatigue = Math.Max(0, a.fatigue - 1); Say(Pick("빈 의자에 앉아 호흡을 고른다. 아까보다 어깨가 가볍다.", "휴대폰을 잠깐 뒤집어 둔다. 창밖을 보다가 물을 한 모금 마신다.")); MaybeRandom(); break;
                case "wait": Spend(15); Say("주변의 움직임을 보며 잠시 기다린다. 조금 전과는 다른 사람들이 지나간다."); break;
                case "random": Spend(arg == "help" ? 10 : 5); Journal("돌발 상황", arg == "help" ? "손이 모자란 학생의 정리를 도왔다." : "통로를 내주고 엉킨 동선을 풀었다."); S.randomEvent = ""; Say(arg == "help" ? "고맙다는 말에 고개를 끄덕인다. 정리가 끝나자 각자 가던 길로 돌아간다." : "한쪽으로 비켜서자 길이 열린다. 급하던 발소리가 멀어진다."); break;
                case "encounter": S.screen = "encounter"; Say("누군가 자기 일을 하다 잠깐 고개를 든다. 말을 걸어볼까."); break;
                case "talk": S.person = arg; S.screen = "dialogue"; S.dialogueStep = 0; var p = Person(arg); p.met = true; Say(Greeting(p), Name(p)); break;
                case "respond": Respond(arg); break;
                case "invite": Invite(arg, false); Say(S.appointments.Any(x => x.id == "player:" + S.day + arg) ? "내일 15시, 카페에서 잠깐이면 괜찮아요. 바뀌면 미리 알려주세요." : "내일은 따로 약속을 잡기 어려울 것 같아요. 다음에 봐요.", Name(Person(arg))); break;
                case "followup":
                    var actor = Person(arg);
                    if (actor.tension >= 6) { Say("지금은 그 얘기를 하고 싶지 않아요. 조금 시간을 주세요.", Name(actor)); break; }
                    string aid = "followup:" + S.day + arg;
                    if (!S.appointments.Any(x => x.id == aid)) S.appointments.Add(new Appointment { id = aid, person = arg, day = S.day, minute = S.minute, location = S.location, label = "함께 일한 뒤의 이야기", kind = "followup", status = "pending" });
                    S.focus = aid; S.screen = "meeting"; Say("잠깐이면 괜찮아요. 지난번에 일 나눴던 거, 나도 생각해봤어요.", Name(actor)); break;
                case "meeting": S.focus = arg; S.person = S.appointments.First(x => x.id == arg).person; S.screen = "meeting"; Say("먼저 와 있었네요. 잠깐 여기서 이야기할까요?", Name(Person(S.person))); break;
                case "meetingChoice": ProgressMeeting(arg); break;
                case "class": S.focus = arg; S.screen = "class"; break;
                case "goClass":
                    var target = World.lessons.First(x => x.Key == arg); S.location = target.location; S.room = target.room; S.screen = "place"; S.returnScreen = "place"; Say(PlaceName(target.location) + " " + RoomName(target.location, target.room) + " 앞에 도착했다."); Pace("classRoute:" + target.Key); break;
                case "classChoice":
                    var c = World.lessons.First(x => x.Key == S.focus); var chosen = c.choices.First(x => x.id == arg); int arrived = S.minute;
                    S.attendance.Add(new Entry { id = c.Key, text = c.name + (arrived <= c.start ? " · 출석" : arrived <= c.start + 15 ? " · 지각" : " · 부분 참석"), day = S.day, minute = arrived });
                    Spend(c.end - S.minute); Journal("수업", c.name + ": " + chosen.text); S.screen = "place"; Say(chosen.text); break;
                case "post":
                    var post = AllPosts().First(x => x.id == arg); S.focus = arg; S.screen = "post";
                    if (!S.completed.Contains("post:" + arg)) { S.completed.Add("post:" + arg); Know("post:" + arg, "캠퍼스톡에서 읽음: " + post.title + (post.kind == "anonymous" ? " (익명 주장 · 미확인)" : "")); }
                    break;
                case "accept":
                    var offer = S.appointments.First(x => x.id == arg);
                    if (offer.day < S.day || offer.day == S.day && S.minute > offer.minute + 15) throw new InvalidOperationException("이미 제안 시간이 지났습니다.");
                    if (S.appointments.Any(x => x.status == "pending" && x.day == offer.day && Math.Abs(x.minute - offer.minute) < Math.Max(x.duration, offer.duration))) throw new InvalidOperationException("이미 수락한 약속과 겹칩니다. 먼저 일정을 조율해주세요.");
                    offer.status = "pending"; Journal("약속", offer.label + " 제안을 수락했다. 수업과 겹치는지 시간표도 확인하자."); break;
                case "decline": S.appointments.First(x => x.id == arg).status = "declined"; break;
                case "cancel": S.appointments.First(x => x.id == arg).status = "cancelled"; Journal("연락", "약속을 미리 취소하고 사정을 전달했다."); break;
                case "apply": S.clubs.Add(new ClubApplication { id = arg, submittedAt = Absolute }); Message("club:" + arg, ClubName(arg) + " 신청이 접수됐습니다. 30분 뒤부터 13–17시 자유관 " + ClubRoomNumber(arg) + "호에서 면접을 볼 수 있습니다."); break;
                case "interview": S.focus = arg; S.screen = "interview"; break;
                case "interviewAnswer":
                    var app = S.clubs.First(x => x.id == S.focus); app.honesty += arg == "honest" ? 1 : -1; app.step++;
                    if (app.step == 2) { Spend(20); app.finishedAt = Absolute; app.status = "reviewing"; S.screen = "place"; Say("가능한 역할과 일정을 이야기하고 면접실을 나온다. 결과는 메시지로 알려주기로 했다."); } break;
                case "join": S.clubs.First(x => x.id == arg).status = "accepted"; Journal("가입", ClubName(arg) + " 가입 의사를 전달했다. 활동 참석 여부는 따로 조율한다."); break;
                case "umbrella": S.umbrella = !S.umbrella; Say(S.umbrella ? "공용 우산을 빌렸다. 사용 후 이곳에 반납하자." : "물기를 털고 우산을 반납했다."); Know("umbrella", "자유관 공용 우산 대여대"); break;
                case "counter": S.screen = "cafe"; break;
                case "drink": S.order = new CafeOrder { item = arg, price = arg == "americano" ? 3000 : arg == "latte" ? 3800 : 3500, day = S.day, temperature = "" }; break;
                case "temperature": S.order.temperature = arg; break;
                case "cancelOrder": S.order = null; break;
                case "pay":
                    if (!TimeFor(10)) throw new InvalidOperationException("주문을 마칠 시간이 부족합니다.");
                    S.spent += S.order.price; S.order.status = "paid"; Spend(4); S.order.readyAt = S.minute + 4 + Random(3); Journal("구매", DrinkName(S.order.item) + " " + S.order.price + "원 결제"); break;
                case "waitDrink": Spend(S.order.readyAt - S.minute); break;
                case "collect": S.order.status = "collected"; S.inventory.Add(new Entry { id = "drink", text = DrinkName(S.order.item), day = S.day, minute = S.minute }); break;
                case "consume": Spend(15); S.order.status = "consumed"; S.inventory.RemoveAll(x => x.id == "drink"); S.screen = "place"; Say(Pick("잔을 내려놓고 창밖을 본다. 급하던 생각이 조금 느려진다.", "빈자리에 앉아 한 모금 마신다. 옆 테이블 이야기는 소음 사이로 흩어진다.")); MaybeRandom(); break;
                case "supply": S.screen = "supply"; S.supply.attended = true; SupplyWitness(); Say("상자 옆에 붙일 표와 옮길 물품이 남아 있다. 먼저 어느 일을 할지 물어본다."); break;
                case "supplyChoice": ProgressSupply(arg); break;
                case "activity": StartActivity(arg); break;
                case "activityChoice": ProgressActivity(arg); break;
                case "resumeActivity": S.screen = "activity"; break;
                case "miniStart": S.activity.phase = 1; break;
                case "miniAssist": S.activity.assisted = true; S.activity.score = 60; S.activity.phase = 3; break;
                case "miniHit": Hit(); break;
                case "miniPause": S.activity.phase = 2; break;
                case "miniConfirm": ConfirmMini(); break;
                case "home":
                    if (S.day == 1 && !S.supply.resolved) ResolveSupply();
                    if (S.minute < 1320) Advance(1320 - S.minute);
                    S.screen = "home"; Journal("귀가", "학교 앞 자취방으로 돌아왔다."); break;
                case "nextDay": NextDay(); break;
            }
        }
        void MaybeRandom()
        {
            string attempt = "randomAttempt:" + Absolute + ":" + S.location;
            if (!TimeFor(10) || Absolute - S.lastRandomAt < 60 || S.completed.Contains(attempt)) return;
            S.completed.Add(attempt);
            if (Random(100) >= 38) return;
            S.lastRandomAt = Absolute; S.randomEvent = Random(2) == 0 ? "paper" : "boxes";
        }
        string Greeting(Actor p)
        {
            if (!Available(p)) return "미안해요. 지금 수업 들어가야 해서요. 나중에 이야기해요.";
            if (p.tension >= 3) return "…무슨 일이에요? 지금 길게 이야기하긴 좀 그래요.";
            if (S.day >= 2 && S.supply.witnesses.Contains(p.id)) return p.trust >= 2 ? "지난번에 같이 정리해서 좀 수월했어요. 오늘은 좀 괜찮아요?" : "지난번에 수고했어요. 난 오늘은 내 일정부터 좀 보려고요.";
            if (!p.met || !p.named) return Pick("아, 여기 지나가시려고요? 잠깐 비킬게요.", "네? 혹시 뭐 찾으세요?", "잠깐만요, 이것만 정리하고요. 무슨 일이세요?");
            return p.familiarity >= 3 ? Pick("아, 왔네요. 오늘은 좀 덜 바빠요?", "아까부터 그 생각 하고 있었는데. 마침 만났네요.", "안 그래도 잠깐 쉬려던 참이었어요.") : Pick("안녕하세요. 오늘도 수업 있어요?", "아, 안녕하세요. 잠깐 쉬고 있었어요.", "또 보네요. 어디 가는 길이에요?");
        }
        void Respond(string choice)
        {
            var p = Person(S.person);
            if (choice == "introduce")
            {
                p.named = true; p.familiarity++; p.lastTalk = Absolute; Say("태이 씨구나. 저는 " + p.name + "예요. 만나서 반가워요.", p.name); Know("name:" + p.id, "직접 인사하며 " + p.name + "의 이름을 알게 됐다."); S.dialogueStep++; return;
            }
            bool cooling = Absolute - p.lastTalk < 30;
            string lead = p.tension >= 3 ? Pick("음… 그건 조금 조심스럽네요.", "지금 바로 답하긴 어려울 것 같아요.") : p.fatigue >= 3 ? Pick("오늘은 좀 피곤해서 생각이 잘 안 돌아가네요.", "잠깐만요, 머리 좀 정리하고요.") : Pick("그러고 보니,", "아, 그거요.", "음, 내 생각에는", "딱 잘라 말하긴 어려운데,");
            string detail;
            if (choice == "repair") { detail = "말해준 건 고마워요. 다만 다음에 어떻게 할지도 같이 정했으면 좋겠어요."; if (!S.completed.Contains("repair:" + S.day + p.id)) { p.tension = Math.Max(0, p.tension - 1); S.completed.Add("repair:" + S.day + p.id); } }
            else if (choice == "check") detail = p.trust >= 2 ? "지금은 괜찮아요. 너무 오래만 아니면요. 무슨 이야기예요?" : "잠깐은 괜찮아요. 이것만 끝내면서 들어도 될까요?";
            else if (choice == "follow") detail = p.id == "soyul" ? Pick("사람들 앞에서는 바로 말이 안 나와요. 그렇다고 의견이 없는 건 아닌데.", "사진도 같은 자리에서 찍어도 다르잖아요. 내가 뭘 보고 있었는지가 남는 것 같아요.") : p.id == "seoyeon" ? Pick("편한 거랑 괜찮은 척하는 건 좀 다르더라고요. 그걸 늦게 말할 때도 있고요.", "혼자 할 수 있는 일도 누가 옆에 있으면 덜 지루하잖아요. 그렇다고 매번 같이 해야 하는 건 아니고.") : Pick("빨리 끝나는 것도 좋은데 나중에 다시 세야 하면 더 오래 걸리니까요.", "사람이 많아도 누가 뭘 하는지 모르면 이상하게 일이 안 줄더라고요.");
            else if (choice == "share") { detail = p.affection >= 2 ? "그런 생각도 하는구나. 다음에 만든 곡도 한번 들려줄래요? 완성 전이어도요." : "노래로 이야기를 남기는 거군요. 처음부터 잘 풀리진 않겠지만 해보는 건 좋네요."; if (!p.memories.Contains("song")) p.memories.Add("song"); }
            else detail = p.id == "yeogyeong" ? Pick("아직 남은 정리만 보고 있었어요. 오늘은 맡은 것부터 끝내려고요.", "숫자가 한 번 안 맞으니까 자꾸 다시 보게 되네요. 잠깐 쉬면 보일 것 같기도 하고.") : p.id == "seoyeon" ? Pick("수업 끝나고 잠깐 앉아 있었어요. 바로 다음 일을 시작하긴 싫어서.", "친구한테 답장하다가 시간이 이렇게 됐네요. 태이 씨는요?") : Pick("별건 아니고, 찍어둔 사진 보고 있었어요. 그냥 지울까 말까 고민 중이라.", "여기 조용해서 잠깐 와 있었어요. 금방 다시 움직이긴 해야 해요.");
            if (choice == "follow" && p.memories.Any(x => x.StartsWith("followup:")))
                detail = p.memories.Last(x => x.StartsWith("followup:")) == "followup:shared" ? "지난번에 가능한 만큼만 하자고 했잖아요. 그 말이 있어서 이번에는 먼저 내 일정을 이야기했어요." : "지난번에 이야기한 건 아직 생각 중이에요. 오늘 바로 정답을 내릴 필요는 없겠죠.";
            string tail = p.trust >= 3 ? Pick(" 태이 씨는 어떻게 생각해요?", " 말하고 보니 나도 조금 정리가 되네요.", " 다음에는 다르게 해볼 수도 있겠어요.") : Pick("", " 아직 잘 모르겠어요.", " 일단은 그렇게 하고 있어요.");
            string line = lead + " " + detail + tail;
            if (p.recentLines.Contains(line)) line += Pick(" …아까랑 조금 비슷한 말이 됐네요.", " 같은 말이어도 오늘은 좀 다르게 느껴지네요.");
            p.recentLines.Add(line); if (p.recentLines.Count > 6) p.recentLines.RemoveAt(0);
            if (!cooling) { p.familiarity++; if (choice == "check" || choice == "share") p.trust++; if (choice == "share" && p.trust >= 2) p.affection++; p.lastTalk = Absolute; }
            Say(line, Name(p)); S.dialogueStep++; Pace("talk:" + p.id + ":" + choice);
        }
        void Invite(string id, bool proactive)
        {
            var p = Person(id); string key = (proactive ? "npc:" : "player:") + S.day + id;
            if (S.completed.Contains("invite:" + S.day + id)) return;
            S.completed.Add("invite:" + S.day + id);
            if (!p.named || p.trust < 2 || p.tension >= 3 || S.day >= 3) return;
            string location = S.supply.burden >= 3 ? "cafe" : "library";
            S.appointments.Add(new Appointment { id = key, person = id, day = S.day + 1, minute = proactive ? 810 : 900, location = proactive ? location : "cafe", label = proactive ? "지난번 이야기 이어가기" : "잠깐 만나 이야기하기", kind = proactive ? "followup" : "meeting", status = proactive ? "offered" : "pending" });
            Message(id, Name(p) + (proactive ? ": 다음에 잠깐 이야기할래요? 가능한 시간일 때만요. 휴대폰 일정에 남겨둘게요." : ": 내일 15시 카페에서 잠깐 봐요. 바뀌면 알려주세요."));
        }
        void SupplyWitness()
        {
            S.supply.present.Clear();
            foreach (var p in Present().Where(x => Available(x)))
            { S.supply.present.Add(p.id); if (!S.supply.witnesses.Contains(p.id)) S.supply.witnesses.Add(p.id); p.met = true; }
        }
        void SupplyView(GameView v)
        {
            v.title = "남은 물품과 서로의 시간";
            if (S.supply.resolved || S.supply.finished) { v.text = S.supply.finished ? "맡은 일을 마치고 주변을 정리했다. 남은 사람들은 각자 다음 일정으로 움직인다." : "물품 준비 시간이 끝났다. 내가 없는 동안에도 다른 사람들의 일은 이어졌다."; v.Add("back", "내 일정으로 돌아간다."); return; }
            v.text = S.narrative + "\n\n" + (S.supply.step == 0 ? "아직 붙이지 않은 표와 점검할 물품이 보인다." : S.supply.step == 1 ? "정리한 상자를 안쪽으로 옮길 차례다. 통로 너머에서 다른 사람이 오간다." : "내역과 남은 물품을 대조하고 다음 사람에게 넘겨야 한다.");
            v.portrait = S.supply.present.FirstOrDefault() ?? "";
            v.Add("supplyChoice", S.supply.step == 0 ? "주변 사람의 남을 수 있는 시간부터 묻는다." : S.supply.step == 1 ? "지금 도울 여유가 있는지 묻고 짐을 나눈다." : "함께 확인하며 인계한다.", "share");
            v.Add("supplyChoice", S.supply.step == 0 ? "표 정리는 내가 맡겠다고 말한다." : S.supply.step == 1 ? "우선 내가 옮기고 나머지도 처리한다." : "내가 한 번에 대조해 끝낸다.", "alone");
            v.Add("back", "남은 시간을 알리고 먼저 자리를 뜬다.");
        }
        void ProgressSupply(string choice)
        {
            SupplyWitness();
            int left = 3 - S.supply.step, duration = Math.Max(1, Math.Min(60, (960 - S.minute) / left));
            var witnesses = S.supply.present.Select(Person).ToArray();
            bool help = choice == "share" && witnesses.Any(x => x.tension < 3 && x.fatigue < 4 && Available(x, duration));
            S.supply.burden += help ? 0 : 2; S.supply.teamwork += help ? 1 : 0;
            foreach (var p in witnesses)
            {
                if (!p.named) { p.named = true; Know("name:" + p.id, "함께 준비하며 " + p.name + "와 인사를 나눴다."); }
                if (!p.memories.Contains("supplies")) p.memories.Add("supplies");
                if (help) { p.trust++; p.familiarity++; }
                else if (choice == "alone") { p.familiarity++; if (S.supply.burden >= 4) p.tension++; }
                p.fatigue++;
            }
            S.supply.step++;
            if (S.supply.step == 3) S.supply.finished = true;
            Spend(duration);
            Say(help ? "남을 수 있는 사람끼리 일을 나눴다. 각자 끝낸 부분을 알려주자 다음 일을 정하기 편해졌다." : choice == "share" ? "지금은 각자 다음 일정이 있거나 여유가 없다는 답이 돌아온다. 가능한 범위까지만 처리하고 남은 일을 적어둔다." : "내 쪽 작업은 빨라졌지만, 어느새 남은 일까지 나에게 모인다. 다른 사람은 어떻게 할지 잠깐 망설인다.");
            Journal("봉사 준비", "현장에서 " + (choice == "share" ? "남을 수 있는 시간을 묻고 역할을 조율했다." : "일을 더 맡아 처리했다."));
            if (S.supply.finished) { S.supply.outcome = S.supply.burden >= 4 ? "solo-burden" : S.supply.teamwork >= 2 ? "shared" : "practical"; Journal("봉사 준비", "내 몫의 작업과 인계를 마쳤다."); }
        }
        void ResolveSupply()
        {
            S.supply.resolved = true;
            if (S.supply.outcome == "") S.supply.outcome = S.supply.attended ? "limited" : "independent";
            var peer = S.peers.First(x => x.first == "seoyeon" && x.second == "soyul");
            // They share a short work window even when the protagonist never attends.
            peer.trust++;
            if (S.supply.burden >= 4 && S.supply.witnesses.Contains("soyul")) peer.tension++;
            // No player-facing diary or discovery for unobserved offscreen completion.
        }
        void MeetingView(GameView v)
        {
            var a = S.appointments.First(x => x.id == S.focus); var p = Person(a.person); v.title = a.label; v.portrait = p.id; v.speaker = Name(p);
            if (a.status == "kept") { v.Add("back", "인사를 마치고 돌아간다."); return; }
            if (a.status != "pending" || a.day != S.day || a.location != S.location || LocationOf(p) != S.location || !Available(p, 10) || !TimeFor(10)) { v.text = "지금은 이야기를 계속하기 어렵다. 서로 일정을 확인하고 다음에 이야기하기로 한다."; v.Add("back", "붙잡지 않는다."); return; }
            if (a.progress == 0)
            { v.Add("meetingChoice", p.tension > 0 ? "내가 놓친 부분이 있었다고 인정하고 말을 듣는다." : "상대가 어떻게 느꼈는지 먼저 듣는다.", "listen"); v.Add("meetingChoice", "내 판단의 이유부터 설명한다.", "explain"); }
            else
            { v.Add("meetingChoice", "다음에는 각자 가능한 범위와 멈출 시점을 함께 정한다.", "share"); v.Add("meetingChoice", "일을 빠르게 끝내는 쪽을 우선하자고 말한다.", "fast"); v.Add("meetingChoice", "오늘은 결론을 내리지 않고 잠깐 쉰다.", "rest"); }
            v.Add("back", "남은 이야기는 다음으로 미룬다.");
        }
        void ProgressMeeting(string choice)
        {
            var a = S.appointments.First(x => x.id == S.focus); var p = Person(a.person);
            a.progress++; Spend(10);
            if (a.progress == 1)
            { S.pendingOutcome = choice; Say(p.id == "yeogyeong" ? "확인할 시간이 있어야 나도 안심하고 넘길 수 있거든요. 빨리 끝난 거랑은 조금 달라요." : p.id == "seoyeon" ? "계속 괜찮다고는 할 수 있는데, 그러면 내가 힘든 걸 아무도 모르잖아요." : "내가 말이 늦어도 아무 생각 없는 건 아니에요. 조금만 기다려줬으면 좋겠어요.", Name(p)); }
            else
            {
                a.status = "kept"; p.familiarity++;
                if (choice == "share") { p.trust++; p.tension = Math.Max(0, p.tension - (S.pendingOutcome == "listen" ? 2 : 1)); a.outcome = "shared"; }
                else if (choice == "fast") { p.trust++; p.tension++; a.outcome = "efficient-distance"; }
                else a.outcome = "easy-company";
                if (a.kind == "followup") p.memories.Add("followup:" + a.outcome);
                Journal("함께한 시간", Name(p) + "와 20분 이야기했다. " + (choice == "share" ? "다음에는 가능한 범위를 먼저 나누기로 했다." : choice == "fast" ? "진행 속도에는 동의했지만, 여유를 두고 싶다는 말도 남았다." : "답을 서두르지 않고 쉬었다."));
                Say(choice == "share" ? "그렇게 해봐요. 내가 할 수 있는 것도 먼저 말할게요." : choice == "fast" ? "일은 빨리 되겠네요. 다만 나는 중간에 확인할 시간도 필요해요." : "오늘은 그냥 이렇게 있어도 괜찮네요. 나머지는 다음에 이야기해요.", Name(p));
            }
        }
        void AddActivities(GameView v)
        {
            if (S.activity != null && S.activity.status == "active" && S.activity.day == S.day && S.activity.location == S.location && S.activity.room == S.room) v.Add("resumeActivity", "하던 활동을 이어간다.");
            if (!ActivityOpen || S.activity != null && S.activity.status == "active") return;
            if (S.location == "gym" && S.room == "court" && TimeFor(60)) v.Add("activity", "코트의 공개 농구 체험에 참여한다.", "basketball");
            if (S.location == "cafeteria" && S.room == "kitchen" && TimeFor(45)) v.Add("activity", "안내받고 조리 체험대에 선다.", "cooking");
            if (S.location == "hall" && S.room == "meeting" && TimeFor(60)) v.Add("activity", "물품 운반을 도울 수 있는지 묻는다.", "carry");
            if (S.location == "arts" && S.room == "band" && S.minute >= 780 && TimeFor(120)) v.Add("activity", "공개 합주에 참여할 수 있는지 묻는다.", "music");
            if (S.day == 2 && S.location == "gym" && S.room == "fitness" && S.minute >= 780 && TimeFor(90)) v.Add("activity", "우천 대체 축구 훈련에 참여한다.", "football");
            if ((S.location == "field" || S.location == "outdoorCourt") && TimeFor(30)) v.Add("activity", S.day == 2 ? "비를 피해 가볍게 걷는다." : "몸을 풀고 가볍게 운동한다.", "exercise");
            if (S.day == 2 && S.location == "library" && Present().Any(x => x.id == "soyul" && Available(x, 45)) && TimeFor(45)) v.Add("activity", "정리 중인 사진에 관해 이야기한다.", "review");
            if (S.day == 3 && S.location == "hall" && S.room == "meeting" && S.minute >= 780 && TimeFor(60)) v.Add("activity", "전시 준비를 도울 수 있는지 묻는다.", "exhibit");
            if (S.day == 3 && S.location == "arts" && S.room == "musical" && S.minute >= 780 && TimeFor(90)) v.Add("activity", "공연 리허설의 동선을 맞춰본다.", "backstage");
            if (S.day == 2 && S.location == "cafeteria" && S.room == "dining" && S.minute >= 780 && S.minute < 840 && Present().Any() && TimeFor(30)) v.Add("activity", "같이 식사할 여유가 있는지 묻는다.", "lunch");
            if (S.location == "library" && TimeFor(30)) v.Add("activity", "자료를 찾아 노트를 정리한다.", "study");
        }
        void StartActivity(string id)
        {
            int duration = id == "cooking" || id == "review" ? 45 : id == "music" ? 120 : id == "football" || id == "backstage" ? 90 : id == "exercise" || id == "study" || id == "lunch" ? 30 : 60;
            S.activity = new ActivityState { id = id, day = S.day, location = S.location, room = S.room, duration = duration, startedAt = S.minute };
            S.screen = "activity"; Say(id == "music" ? "다른 파트의 소리를 듣고 비어 있는 자리를 확인한다. 오늘 어느 파트로 들어갈까." : id == "cooking" ? "안전 안내를 듣고 손을 씻는다. 옆 조와 도구를 나눠 쓰기로 한다." : id == "carry" ? "상자 크기와 통로를 살핀다. 무게보다 움직일 길부터 보는 게 낫겠다." : id == "basketball" ? "운동화 끈을 다시 묶는다. 코트에서는 세 번씩 공격해보기로 한다." : "주변 사람에게 이용할 공간을 확인하고 준비를 시작한다.");
        }
        void ActivityView(GameView v)
        {
            var a = S.activity; v.title = ActivityName(a.id); v.portrait = "";
            if (new[] { "basketball", "cooking", "carry" }.Contains(a.id)) v.art = "Activities:" + a.id;
            if (a.status == "completed") { v.Add("back", "마무리하고 돌아간다."); return; }
            if (a.day != S.day || a.location != S.location || a.room != S.room) { v.text = "하던 활동 장소로 돌아가야 이어갈 수 있다."; v.Add("back", "돌아간다."); return; }
            if (!TimeFor(a.duration - a.spentMinutes)) { v.text = "남은 활동을 마치기에는 시간이 부족하다. 오늘은 정리하고 돌아가자."; v.Add("back", "활동을 정리한다."); return; }
            if (a.step == 0)
            {
                if (a.id == "music") { v.Add("activityChoice", "보컬 파트를 맡는다.", "vocal"); v.Add("activityChoice", "베이스로 리듬을 받친다.", "bass"); v.Add("activityChoice", "기타 파트를 맞춘다.", "guitar"); }
                else { v.Add("activityChoice", a.id == "basketball" ? "수비 위치를 보고 패스할 길을 먼저 찾는다." : a.id == "carry" ? "큰 상자는 둘이 들기로 하고 동선을 확보한다." : "작게 나눠 준비하고 서로 진행 상태를 확인한다.", "share"); v.Add("activityChoice", a.id == "basketball" ? "빠른 돌파로 직접 공간을 만든다." : "내가 맡은 부분부터 빠르게 처리한다.", "fast"); }
                v.Add("back", "준비를 잠시 멈춘다.");
            }
            else if (a.step == 1 && new[] { "basketball", "cooking", "carry" }.Contains(a.id))
            {
                if (a.phase == 0 || a.phase == 2) { v.text = (a.phase == 2 ? "일시정지. 입력 위치와 진행 상태가 유지됩니다.\n" : "") + "표시가 가운데 영역에 왔을 때 Space 또는 입력 버튼을 누르세요. 세 번 입력한 뒤 결과를 확인합니다."; v.Add("miniStart", a.phase == 2 ? "이어서 시작" : "타이밍 시작"); v.Add("miniAssist", "타이밍 조작 없이 진행"); }
                else if (a.phase == 1) { v.text = "가운데에 맞춰 입력 · " + a.attempts + "/3"; v.Add("miniHit", "입력 · Space"); v.Add("miniPause", "잠깐 멈추기"); }
                else { v.text = (a.assisted ? "조작 보조로 진행했다." : "타이밍 점수 " + a.score + "/100") + "\n" + (a.score >= 75 ? "호흡과 움직임이 자연스럽게 맞았다." : a.score >= 45 ? "중간에 다시 맞추면서 끝까지 이어갔다." : "서두르다 흐름이 끊겼다. 다음에는 속도를 낮추는 편이 좋겠다."); v.Add("miniConfirm", "결과를 확인하고 마무리한다."); }
            }
            else if (a.step == 1) { v.Add("activityChoice", a.id == "music" ? "다른 파트를 듣고 호흡과 음량을 맞춘다." : "속도를 조절하며 차근차근 진행한다.", "blend"); v.Add("activityChoice", "내가 생각한 방식으로 한 번 밀어붙여본다.", "push"); }
            else { v.Add("activityChoice", a.id == "cooking" ? "맛을 확인하고 함께 정리한다." : a.id == "music" ? "처음부터 이어 연주하고 녹음을 들어본다." : "서로 상태를 확인하고 도구를 정리한다.", "finish"); v.Add("activityChoice", "잘 안 된 부분을 짚고 다음에 다시 해보기로 한다.", "review"); }
        }
        static string ActivityName(string id)
        { return id == "basketball" ? "코트 위의 세 번의 공격" : id == "cooking" ? "한 냄비 조리 체험" : id == "carry" ? "함께 옮기는 물품" : id == "music" ? "공개 합주" : id == "football" ? "실내 대체 훈련" : id == "study" ? "자료와 메모" : id == "review" ? "사진 속 이야기" : id == "exhibit" ? "전시 준비" : id == "backstage" ? "리허설 뒤편" : id == "lunch" ? "비 오는 날의 식사" : "가벼운 운동"; }
        void ProgressActivity(string choice)
        {
            var a = S.activity;
            var people = Present().Where(x => Available(x)).ToArray();
            foreach (var p in people) { p.met = true; if (!a.witnesses.Contains(p.id)) a.witnesses.Add(p.id); }
            if (a.step == 0)
            {
                a.role = choice; a.approach = choice;
                int prep = a.id == "music" ? 20 : a.id == "football" ? 15 : a.id == "study" || a.id == "exercise" ? 5 : 10;
                Spend(prep); a.spentMinutes += prep; a.step = 1; Say(choice == "share" ? "먼저 할 일과 함께할 부분을 나누었다. 서로 준비를 끝냈는지 확인한다." : "준비를 마치고 자리를 잡는다. 주변의 속도를 살피며 시작할 때를 기다린다.");
            }
            else if (a.step == 1)
            { int middle = a.id == "music" ? 60 : a.id == "football" ? 45 : 15; Spend(middle); a.spentMinutes += middle; a.score = choice == "blend" ? 80 : 55; a.step = 2; Say(choice == "blend" ? "한 번 어긋난 부분에서 멈췄다가 다시 맞췄다. 두 번째에는 전보다 자연스럽다." : "생각한 방식으로 해보니 빠르게 되는 부분도, 남들과 어긋나는 부분도 보인다."); }
            else
            {
                int remaining = a.duration - a.spentMinutes;
                Spend(remaining); a.spentMinutes += remaining; a.status = "completed"; S.completed.Add("activity:" + S.day + ":" + a.id);
                foreach (string id in a.witnesses.Where(id => people.Any(p => p.id == id)))
                { var p = Person(id); p.familiarity++; if (a.approach == "share" || choice == "review") p.trust++; p.memories.Add(a.id + ":" + a.score); }
                Know("activity:" + a.id, PlaceName(S.location) + " · " + ActivityName(a.id) + "의 이용 공간과 정리 방법");
                Journal("활동", ActivityName(a.id) + "을 마쳤다. " + (a.assisted ? "조작 보조 사용." : "결과 " + a.score + "/100."));
                Say(choice == "review" ? "잘 안 맞던 부분을 짧게 짚었다. 다음에 바꿔볼 것을 하나씩 남기고 자리를 정리한다." : Pick("사용한 공간을 정리한다. 시작할 때보다 손에 익은 느낌이 남는다.", "끝난 뒤에야 긴장이 풀린다. 다음 사람이 쓸 수 있게 자리를 비운다."));
            }
        }
        public float MiniPosition
        { get { var a = S.activity; if (a == null) return 0; float phase = (a.elapsedMs % 1800) / 900f; return phase <= 1 ? phase : 2 - phase; } }
        public void AdvanceMini(int milliseconds)
        { if (S.screen == "activity" && S.activity != null && S.activity.phase == 1 && S.activity.status == "active") S.activity.elapsedMs += Math.Max(0, Math.Min(100, milliseconds)); }
        void Hit()
        {
            var a = S.activity;
            if (a.elapsedMs - a.lastHitMs < 240) return;
            a.lastHitMs = a.elapsedMs;
            int score = (int)Math.Round(Math.Max(0, 1 - Math.Abs(MiniPosition - 0.5f) * 2) * 100);
            a.hits += score; a.attempts++;
            if (a.attempts == 3) { a.score = a.hits / 3; a.phase = 3; }
        }
        void ConfirmMini()
        {
            var a = S.activity; int duration = a.id == "cooking" ? 25 : 30; Spend(duration); a.spentMinutes += duration; a.step = 2;
            Say(a.id == "basketball" ? (a.score >= 75 ? "패스와 움직임이 맞아 좋은 기회를 만들었다. 마지막 공격 뒤 서로 손을 마주친다." : "수비에 막힌 순간도 있었다. 무리한 공부터 다시 돌아보며 숨을 고른다.") : a.id == "cooking" ? (a.score >= 75 ? "재료의 익는 속도가 맞았다. 한 숟갈 맛보고 간을 조금만 더한다." : "중간에 불을 낮추며 익는 속도를 맞췄다. 맛을 보고 다음 순서를 이야기한다.") : (a.score >= 75 ? "서로 신호를 맞춰 큰 상자를 내려놓았다. 통로도 막히지 않았다." : "몇 번 멈추며 손잡이를 다시 잡았다. 다음 상자는 짐을 더 나누기로 한다."));
        }
        void NextDay()
        {
            if (S.day == 3) { S.ended = true; S.screen = "place"; return; }
            foreach (var a in S.activity == null ? new ActivityState[0] : new[] { S.activity }) if (a.status == "active") a.status = "abandoned";
            if (S.day == 1)
            {
                foreach (var p in S.actors.Where(x => x.named && S.supply.witnesses.Contains(x.id)).ToArray())
                    if (p.trust >= 2 && p.tension < 3) { Invite(p.id, true); break; }
            }
            S.day++; S.minute = 540; S.location = "arts"; S.room = ""; S.person = ""; S.focus = ""; S.screen = "place"; S.returnScreen = "place"; S.randomEvent = ""; S.pace.Clear(); S.order = null; S.inventory.RemoveAll(x => x.id == "drink");
            foreach (var p in S.actors) p.fatigue = Math.Max(0, p.fatigue - 3);
            TickCommunity(); Say(S.day == 2 ? "비가 내린다. 처마 아래서 가방을 고쳐 멘다. 오늘 수업과 어제 남겨둔 연락을 확인해볼까." : "복도에서 학생들이 휴대폰 화면을 보여주며 이야기한다. 정확히 무슨 일인지는 아직 모르겠다.");
            Journal("등교", S.day + "일차를 시작했다.");
        }
    }
}

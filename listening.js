/* ========== リスニング本番対策＋シャドーイング ==========
   ・本番の出題傾向に合わせた新作問題：Part 2 45問／Part 3 12セット（3人の会話・意図問題・図表問題）／Part 4 10セット
   ・Part 3・4 は本番と同じ流れ：設問の先読み → 音声は1回だけ → 解答時間 → 解説とスクリプト
   ・音声は話者ごとに声を変え、セットごとに米・英・豪・加の発音を使い分ける（本番は4か国の発音）
   ・模試と Part 1 も「音声だけ」で解く形式に（以前はスクリプトや選択肢が文字で見えていた）
   ・シャドーイング：聞く → 音読（パラレル）→ シャドーイング → 1文ずつ音声認識でチェック の4ステップ
   index.html / growth.js / toeic_core.js / plan650.js / habit.js の後に読み込む。 */
'use strict';

/* ---------- 新作問題 ---------- */
// Part 2：[問いかけ, [正解, 誤答, 誤答], 解説]（読み込み時に正解の位置を散らす）
const LX_P2=[
  ["Who's in charge of ordering office supplies?",["Check with the receptionist.","Some pens and paper.","Yes, it's in order."],"間接応答「受付に聞いて」。担当者名を言わない正解が本番では多い。order の繰り返しはひっかけ。"],
  ["When will the new software be installed?",["The IT team hasn't decided yet.","It's very easy to use.","In the storage room."],"「まだ決まっていない」系は When/Where/Who どれにも正解になる万能応答。"],
  ["Where should I put these boxes?",["Anywhere by the door is fine.","About twenty boxes.","I put on a jacket."],"Where → 場所。put の繰り返し（put on）はひっかけ。"],
  ["Why is the elevator out of service?",["There's a sign about the repairs.","It's on the fifth floor.","Yes, the service was excellent."],"理由を直接言わず「貼り紙がある」と示す間接応答。WH疑問文に Yes/No は不可。"],
  ["How often do you visit the Boston office?",["About once a month.","It's a large office.","By train."],"How often → 頻度。By train は How（手段）への答え。"],
  ["What time does the workshop begin?",["Didn't you get the e-mail?","In Room B.","It was very useful."],"質問に質問で返す「メール見てない？」は本番頻出の正解パターン。"],
  ["Which hotel did you book for the conference?",["The one near the convention center.","Two nights.","A book about marketing."],"Which → the one ～ で答える。book（予約する／本）の多義語ひっかけ。"],
  ["Whose turn is it to clean the break room?",["I think it's Mark's.","Turn left at the corner.","Yes, it's clean."],"Whose → 人の所有。turn（順番／曲がる）の多義語ひっかけ。"],
  ["How much will the repairs cost?",["The technician will give us an estimate.","Yes, a lot of people.","Since last Tuesday."],"金額を言わず「見積もりが出る」と答える間接応答。"],
  ["Who will be giving the presentation tomorrow?",["It's been postponed.","A sales report.","At ten o'clock."],"前提をくつがえす応答（延期された）。誰が？に人名以外が正解になる典型。"],
  ["Where's the nearest post office?",["I'm new here too.","Some stamps, please.","It closes at five."],"「私もここは初めて」＝知らない、の間接応答。"],
  ["Why don't we take a short break?",["Good idea, I need some coffee.","Because it broke.","It took two hours."],"Why don't we ～? は理由ではなく提案。Because で始まる選択肢は誤答の定番。"],
  ["Could you send me the updated schedule?",["Sure, I'll do it right after lunch.","It was updated yesterday.","No, I didn't send it."],"依頼 → 引き受ける/断る。updated・send の繰り返しはひっかけ。"],
  ["Would you like me to call a taxi for you?",["Thanks, but my colleague is driving me.","Yes, I called him.","It's a long trip."],"申し出 → 受ける/やんわり断る。"],
  ["Can you help me move this table?",["I'm on my way to a meeting.","It's a wooden table.","Yes, they moved last year."],"「会議に向かうところ」＝手伝えない、の間接的な断り。"],
  ["Let's review the budget before Friday.",["I'm free on Thursday morning.","A larger budget.","I reviewed the movie."],"提案の平叙文 → 都合を答えて同意。"],
  ["Do you know if the printer is working again?",["Yes, someone fixed it this morning.","I usually work from home.","Print twenty copies."],"Do you know if ～ は「～かどうか」を聞いている。work の繰り返しはひっかけ。"],
  ["Have you finished the quarterly report?",["I'm still waiting for some figures.","It was a quarter past three.","Yes, the report says so."],"「数字待ち」＝まだ終わっていない。quarter の音のひっかけ。"],
  ["Isn't the store open on Sundays?",["Only during the holiday season.","The door is open.","I bought some shoes."],"否定疑問文は普通の疑問文（Is the store open?）と同じに考える。"],
  ["You're coming to the client dinner, aren't you?",["I wouldn't miss it.","The client called.","Yes, dinner is ready."],"付加疑問文。I wouldn't miss it＝必ず行く。"],
  ["Did the shipment arrive on time?",["It came a day early, actually.","The ship is very large.","At the loading dock."],"on time? → 早く着いた。shipment/ship の似た音ひっかけ。"],
  ["Is this seat taken?",["No, go ahead.","Yes, I took the train.","A comfortable chair."],"Is this seat taken? に No＝空いている、どうぞ。"],
  ["Should we hire a caterer or prepare the food ourselves?",["Let's see how many people sign up.","Yes, we should.","The food was delicious."],"選択疑問文に Yes/No は不可。判断保留が正解になりやすい。"],
  ["Would you prefer a window seat or an aisle seat?",["Whichever is available.","Yes, please.","The window is open."],"選択疑問文 → どちらでも（Whichever / Either）が定番の正解。"],
  ["Is the meeting in Room A or Room C?",["It's been moved to the cafeteria.","Yes, it's a big room.","At three thirty."],"AでもBでもない「第3の答え」も正解になる。"],
  ["Are you taking the train or driving to the trade show?",["My manager is giving me a ride.","The show starts at nine.","I trained the new staff."],"車に乗せてもらう＝第3の答え。train（電車/訓練する）ひっかけ。"],
  ["The projector in Room 5 isn't working.",["I'll call the maintenance department.","I'm working late tonight.","A five-page project."],"問題の報告 → 対応策で返す。"],
  ["I can't find my building pass.",["Did you check your jacket pocket?","We passed the building.","It costs ten dollars."],"困りごと → 質問で手助け。pass の繰り返しはひっかけ。"],
  ["The sales figures look better this month.",["The new advertising campaign must be working.","Twelve months.","Sale items are on the second floor."],"感想の平叙文 → 理由を推測して応じる。"],
  ["We're running out of paper for the copier.",["I ordered some yesterday.","He runs every morning.","Make two copies, please."],"run out of＝切らす。run・copy の繰り返しはひっかけ。"],
  ["How was the job fair last weekend?",["We met several strong candidates.","It's not fair.","Every weekend."],"How was ～? → 感想・結果。fair（見本市/公平な）の多義語ひっかけ。"],
  ["What did you think of the new logo design?",["It's much more eye-catching.","I signed it.","Yesterday afternoon."],"What did you think of ～? → 感想。"],
  ["Where can I get a parking permit?",["The security desk issues them.","Yes, parking is free.","Permit me to explain."],"場所を「警備デスクが発行」と言い換え。permit の繰り返しはひっかけ。"],
  ["When is the deadline for the grant application?",["Let me check the website.","Twenty applicants.","To the finance director."],"「確認します」は万能の正解パターン。"],
  ["Why was the delivery truck late?",["There was heavy traffic on the highway.","Late in the afternoon.","It's a large truck."],"Why → 理由。Because を使わない理由の答え方も多い。"],
  ["Who approved the travel expenses?",["Ms. Kim signed off on them.","About three hundred dollars.","It was a long trip."],"sign off on＝承認する。人名で答える基本形。"],
  ["How do I register for the training session?",["There's a link in the newsletter.","In the main conference room.","Session two starts soon."],"How → 方法。場所の答えは誤答。"],
  ["Do you want to join us for lunch?",["I brought something from home today.","Lunch is at noon.","I joined last year."],"「弁当を持ってきた」＝やんわり断る。"],
  ["Haven't the new employees received their laptops yet?",["They're being set up now.","Yes, it's brand new.","At the employee entrance."],"否定疑問文。「今セットアップ中」＝まだ。"],
  ["Why don't you ask Tom for help with the spreadsheet?",["He's on vacation this week.","Because it's due today.","A help desk."],"提案に「彼は休暇中」と返す間接応答。"],
  ["Where are the extra chairs for the seminar?",["Room 210 has plenty.","They're very comfortable.","The seminar starts at one."],"Where → 場所（部屋番号）。"],
  ["Would you mind closing the window?",["Not at all.","I don't mind the rain.","It closes at six."],"Would you mind ～? に Not at all＝いいですよ。"],
  ["Which of these colors should we use for the brochure?",["The blue matches our logo.","Fifty brochures.","I use it every day."],"Which → 選んで理由も添える。"],
  ["Mr. Lee's flight has been delayed.",["Then we should reschedule the meeting.","A window seat.","He flew to Seoul last year."],"報告の平叙文 → 次の対応で返す。"],
  ["Has the budget proposal been approved?",["The board meets next Monday.","A proposal for a new office.","Yes, it was a good price."],"「役員会は来週」＝まだ承認されていない、の間接応答。"]
];
// Part 3・4：k=セット記号, g=図表（タイトル, 見出し, 行…／'|'区切り）, s=スクリプト, q=[設問, 選択肢, 正解番号, 解説]
const LX_P3=[
  {k:'a',s:"W: Hi, this is Linda from Carter Consulting. I'd like to change our catering order for Thursday's lunch meeting.\nM: Of course. I have your order here: sandwiches and salads for twenty people. What would you like to change?\nW: A few more people have signed up, so we'll need food for twenty-five. Could you also add some vegetarian options?\nM: No problem. I can add a vegetable wrap platter. But since the order is bigger, delivery will be at eleven thirty instead of noon.\nW: That's actually better for us. Thanks!",
   q:[["Why is the woman calling?",["To change an order","To complain about a delivery","To book a meeting room","To ask about prices"],0,"目的は冒頭で言う。I'd like to change our catering order。"],
      ["What does the woman ask the man to add?",["Vegetarian options","Desserts","Drinks","Extra chairs"],0,"Could you also add some vegetarian options?"],
      ["What will be different about the delivery?",["It will arrive earlier.","It will cost more.","It will go to another address.","It will be split into two."],0,"eleven thirty instead of noon → 早まる、と言い換える。"]]},
  {k:'b',s:"M: Sarah, Kenji, have you heard? The marketing team is moving to the third floor next month.\nW: Really? I thought the third floor was being renovated.\nM2: It was, but the work finished early. The new space has a much bigger meeting room.\nW: That'll be great for our client presentations. Do we know the exact moving date?\nM: Not yet. Facilities will send an e-mail with the schedule this week.\nM2: I'll ask them to give us a few days' notice so we can pack our files.",
   q:[["What are the speakers mainly discussing?",["An office relocation","A new client","A hiring plan","A building inspection"],0,"3人の会話。moving to the third floor → relocation（移転）。"],
      ["What is mentioned about the third floor?",["Its renovation was completed early.","It is too small.","It will be closed next month.","It has no meeting rooms."],0,"the work finished early＝改装が早く終わった。"],
      ["What will one of the men ask the facilities department to do?",["Give advance notice of the moving date","Provide more boxes","Repaint the meeting room","Extend a deadline"],0,"a few days' notice → advance notice（事前の知らせ）の言い換え。"]]},
  {k:'c',s:"W: Good evening. I have a reservation under the name Rivera, for three nights.\nM: Welcome, Ms. Rivera. I'm afraid your room isn't ready yet. The previous guests checked out late.\nW: Oh, I have a dinner meeting in an hour and wanted to change first.\nM: I understand. Our fitness center has a changing room, and I can keep your luggage at the front desk.\nW: Well, that'll do for now.\nM: And to make up for the wait, breakfast will be complimentary during your stay.",
   q:[["Where most likely does the conversation take place?",["At a hotel","At a restaurant","At an airport","At a gym"],0,"reservation・room・checked out から場所を判断。"],
      ["What does the woman imply when she says, \"Well, that'll do for now\"?",["She will accept the suggestion.","She is leaving the hotel.","She wants to speak to a manager.","She has finished her meeting."],0,"意図問題。直前の提案（更衣室・荷物預かり）を「とりあえずそれで」と受け入れている。"],
      ["What does the man offer the woman?",["Free breakfast","A room upgrade","A discount on dinner","A late checkout"],0,"complimentary＝無料。本番頻出の言い換え。"]]},
  {k:'d',g:"Building Directory|2|Floor|Company|1|Bright Dental|2|Lopez Law Office|3|Nova Design|4|Green Tech",s:"M: Excuse me, I'm here for a job interview at Nova Design, but I can't find the elevator.\nW: The elevators are behind the coffee shop. But Nova Design moved last week. They're now one floor above their old office.\nM: Oh, I didn't know that. Thanks. Is there somewhere I can leave my umbrella?\nW: There's a stand right by the entrance.",
   q:[["Why is the man visiting the building?",["For a job interview","To deliver a package","To see a dentist","To meet a lawyer"],0,"冒頭 I'm here for a job interview。"],
      ["Look at the graphic. Which floor will the man go to?",["Floor 1","Floor 2","Floor 3","Floor 4"],3,"図表問題。案内板は古い情報（3階）。one floor above → 4階。図表と会話の「ずれ」が狙われる。"],
      ["What does the woman say about the umbrella stand?",["It is near the entrance.","It is full.","It is behind the coffee shop.","It is on each floor."],0,"right by the entrance。behind the coffee shop はエレベーターの場所でひっかけ。"]]},
  {k:'e',s:"W: Tom, the order from Hanson Foods just doubled. They need eight hundred cases by the end of the month.\nM: That's great news, but our packing line is already running at full capacity.\nW: I know. What if we added a weekend shift?\nM: That could work. I'll check with the staff to see who's available for overtime.\nW: Good. And let's ask the supplier whether they can send the boxes earlier.",
   q:[["What news does the woman share?",["A customer increased an order.","A machine broke down.","A supplier went out of business.","A shift was canceled."],0,"doubled → increased の言い換え。"],
      ["What problem does the man mention?",["The packing line is at full capacity.","Some boxes are damaged.","A deadline was missed.","Workers are on vacation."],0,"running at full capacity＝フル稼働で余裕がない。"],
      ["What does the woman suggest?",["Adding a weekend shift","Finding a new supplier","Raising prices","Delaying the order"],0,"What if we ～? は提案の定番表現。"]]},
  {k:'f',s:"M: Hi, Ms. Chen. You asked IT to look at your laptop?\nW: Yes, it keeps freezing whenever I open the sales database. I need to finish a report this afternoon.\nM: It's probably a memory issue. I could install an upgrade, but it would take about an hour.\nW: I've got a client call at two.\nM: All right, then I'll lend you a spare laptop for now and do the upgrade tomorrow morning.\nW: Perfect. I'll back up my files before I leave today.",
   q:[["What problem does the woman have?",["Her laptop keeps freezing.","She forgot her password.","Her report was deleted.","The database is closed."],0,"keeps freezing＝固まり続ける。"],
      ["Why does the woman say, \"I've got a client call at two\"?",["To indicate that she cannot wait an hour","To invite the man to a call","To change a meeting time","To ask for a phone"],0,"意図問題。「1時間かかる」への返事 → 待てない、と伝えている。"],
      ["What will the woman do before she leaves today?",["Back up her files","Return the spare laptop","Call the client","Write a report for IT"],0,"最後の発言に答え。I'll back up my files。"]]},
  {k:'g',g:"Shipping Options|3|Service|Delivery|Price|Economy|5-7 days|$8|Standard|3-4 days|$15|Express|2 days|$25|Overnight|Next day|$40",s:"W: Hi, I'd like to send these samples to a client in Denver.\nM: Sure. When do they need to arrive?\nW: The client meeting is on Friday, so within three days or so should be fine. I'd rather not pay for the fastest option, though.\nM: Then I'd recommend this one. It arrives in two days, which gives you a little extra time.\nW: Great. Can I also get a tracking number?\nM: Of course. It'll be printed on your receipt.",
   q:[["What is the woman sending?",["Samples","Contracts","Brochures","Uniforms"],0,"send these samples。"],
      ["Look at the graphic. How much will the woman pay for shipping?",["$8","$15","$25","$40"],2,"図表問題。arrives in two days → Express → $25。「最速は避けたい」も手がかり。"],
      ["What does the woman ask for?",["A tracking number","A discount","A larger box","An e-mail receipt"],0,"receipt は男性の発言に出るひっかけ。"]]},
  {k:'h',s:"W: Thanks for coming in, Mr. Brooks. I'm Ana Silva, and this is my colleague Rachel Kim from our accounting team.\nW2: Nice to meet you. We were impressed by your experience with budgeting software.\nM: Thank you. At my current job, I trained our whole department on a new system.\nW: That's exactly what we need. We're switching systems in the spring.\nW2: Would you be comfortable leading some training sessions?\nM: Definitely. I enjoy teaching.",
   q:[["What is the purpose of the meeting?",["A job interview","A training session","A sales presentation","A budget review"],0,"3人の会話。Thanks for coming in・experience から面接と判断。"],
      ["What does the man say he did at his current job?",["He trained his department on a new system.","He managed a sales team.","He designed software.","He reduced costs."],0,"I trained our whole department on a new system。"],
      ["What will happen in the spring?",["The company will change systems.","The man will start working.","A new office will open.","The budget will be approved."],0,"switching systems → change systems。"]]},
  {k:'i',s:"M: Hi, I reserved a compact car for this week. The name's Patel.\nW: Let me see. Yes, Mr. Patel. Unfortunately, all our compact cars are out right now. I can give you a midsize car at the same rate.\nM: Oh, that's fine. Does it have GPS?\nW: It does. And it's the last one we have.\nM: Then I'll take it. Do I return it to this location?\nW: Yes, and please fill up the tank before you bring it back.",
   q:[["Where does the woman most likely work?",["At a car rental agency","At a gas station","At a hotel","At a travel agency"],0,"reserved a compact car・return it から判断。"],
      ["Why does the woman say, \"it's the last one we have\"?",["To encourage the man to decide quickly","To apologize for a mistake","To explain a higher price","To suggest another branch"],0,"意図問題。「最後の1台」＝早く決めたほうがいい、の含み。"],
      ["What does the woman ask the man to do?",["Refill the gas tank","Return the car early","Show his license","Pay a deposit"],0,"fill up the tank → refill the gas tank の言い換え。"]]},
  {k:'j',g:"Conference Schedule (Room 2)|2|Time|Session|9:00|Digital Marketing|10:30|Global Supply Chains|1:00|Leadership Skills|3:00|Customer Data",s:"W: Did you see that the session on supply chains has been canceled? The speaker's flight was delayed.\nM: That's too bad. I was looking forward to it. What are they doing with the time slot?\nW: They're moving the afternoon session on customer data into it.\nM: Oh, that works for me. Then I can leave early to catch my train.\nW: Lucky you. I have to stay for the leadership session.",
   q:[["Why was a session canceled?",["A speaker's flight was delayed.","A room was unavailable.","Too few people registered.","The equipment failed."],0,"The speaker's flight was delayed。"],
      ["Look at the graphic. What time will the customer data session start now?",["9:00","10:30","1:00","3:00"],1,"図表問題。中止された supply chains の枠（10:30）に移る。"],
      ["What does the man plan to do?",["Leave early","Give a presentation","Change rooms","Book a flight"],0,"I can leave early to catch my train。"]]},
  {k:'k',s:"M: Hello, I'm calling about the office space for rent on Maple Street. Is it still available?\nW: Yes, it is. It's about a hundred square meters, with a kitchen and two meeting rooms.\nM: That sounds good. Is parking included?\nW: There are four parking spaces for tenants, and there's street parking nearby.\nM: We have six employees who drive, but some could take the bus. Could I see the space tomorrow?\nW: How about ten a.m.? I'll meet you at the front entrance.",
   q:[["What is the man inquiring about?",["Renting an office","Buying a car","Hiring staff","Booking a meeting room"],0,"office space for rent。"],
      ["What does the woman say about parking?",["There are four spaces for tenants.","It is free on weekends.","It is not available.","It costs extra."],0,"four parking spaces for tenants。"],
      ["What will the speakers do tomorrow?",["Tour the office space","Sign a contract","Meet the employees","Take a bus"],0,"see the space → tour の言い換え。"]]},
  {k:'l',s:"W: Have you tried submitting expenses with the new online system yet?\nM: I tried this morning, but it kept asking me to upload receipts in a format I didn't have.\nW: You're not the only one. Half the sales team has complained about it.\nM: Should we let someone know?\nW: Accounting is holding a help session on Wednesday afternoon. I'm going to sign up.\nM: Me too. I've got three trips to report.",
   q:[["What are the speakers discussing?",["A new expense system","A sales trip","A team meeting","A software sale"],0,"submitting expenses with the new online system。"],
      ["What does the woman mean when she says, \"You're not the only one\"?",["Other people have had the same problem.","The man should work with others.","Only one receipt is needed.","The man is not on the sales team."],0,"意図問題。直後の Half the sales team has complained が根拠。"],
      ["What will the woman do?",["Sign up for a help session","Visit a client","Upload the man's receipts","Call the sales team"],0,"I'm going to sign up。"]]}
];
const LX_P4=[
  {k:'a',s:"Hi, Mr. Grant. This is Paula from Westside Printing. I'm calling about the brochures you ordered for your trade show. Our main printer broke down this morning, so we can't finish the job by Wednesday as planned. I know it's short notice, but we could have them ready by Thursday at noon, and we'll deliver them to your booth at no charge. Please call me back at 555-0182 to let me know if that works.",
   q:[["Why is the speaker calling?",["To report a delay","To confirm a payment","To advertise a sale","To request a design"],0,"留守電は「目的→詳細→お願い」の順。can't finish by Wednesday＝遅れ。"],
      ["Why does the speaker say, \"I know it's short notice\"?",["She realizes the change is inconvenient.","She wants a quick reply.","The trade show is short.","The brochure is short."],0,"意図問題。急な変更で申し訳ない、という気持ち。"],
      ["What does the speaker offer to do?",["Deliver the order for free","Give a full refund","Print extra copies","Use a different printer"],0,"at no charge → for free。"]]},
  {k:'b',s:"Attention, Fresh Mart shoppers. For the next thirty minutes, all bakery items are twenty percent off. That includes our freshly baked bread, muffins, and cakes. Also, please note that our store will be closing early this Sunday, at six p.m., for inventory. And if you haven't signed up for our rewards card yet, visit the customer service desk near the entrance. New members receive a free reusable shopping bag.",
   q:[["Where is the announcement being made?",["At a grocery store","At a cooking school","At a library","At a train station"],0,"shoppers・bakery items から判断。"],
      ["What will happen on Sunday?",["The store will close early.","A sale will begin.","New staff will start.","The bakery will be renovated."],0,"closing early this Sunday。"],
      ["What can new rewards members receive?",["A free shopping bag","A discount on bread","A gift card","Free delivery"],0,"最後の文。"]]},
  {k:'c',g:"Harbor City Walking Tour|2|Stop|Place|1|Old Lighthouse|2|Fish Market|3|Maritime Museum|4|Harbor Park",s:"Good morning, everyone, and welcome to the Harbor City Walking Tour. My name is Daniel, and I'll be your guide today. Before we start, one quick change. The fish market is closed for cleaning today, so we'll skip that stop and spend extra time at the museum instead. The tour will take about two hours. If you'd like to take photos at the lighthouse, I'll give you ten minutes there. Water bottles are available on the bus for free.",
   q:[["Who most likely is the speaker?",["A tour guide","A museum curator","A bus driver","A fisherman"],0,"I'll be your guide today。"],
      ["Look at the graphic. Which stop will be skipped?",["Stop 1","Stop 2","Stop 3","Stop 4"],1,"図表問題。fish market → Stop 2。"],
      ["What does the speaker say is available on the bus?",["Free water","Maps","Umbrellas","Snacks"],0,"Water bottles are available on the bus for free。"]]},
  {k:'d',s:"Is your home ready for winter? At Thompson Heating, our certified technicians can inspect your heating system and fix small problems before they become expensive ones. This month only, we're offering a full inspection for just forty-nine dollars. That's half our usual price. Appointments fill up fast, so book yours today on our Web site. And mention this ad to receive a free air filter with your visit.",
   q:[["What is being advertised?",["A heating service","A home insurance plan","An appliance store","A cleaning company"],0,"広告は冒頭で商品・サービスが分かる。"],
      ["What is special about this month?",["Inspections are half price.","A new store is opening.","New technicians were hired.","Service hours are extended."],0,"half our usual price。"],
      ["How can listeners get a free air filter?",["By mentioning the advertisement","By booking online","By visiting the store","By paying in cash"],0,"mention this ad。"]]},
  {k:'e',s:"Let's start today's meeting with some good news. Our customer satisfaction survey results came in yesterday, and our scores improved in every category. Believe it or not, the biggest improvement was in delivery speed, the area we struggled with most last year. That's thanks to the new warehouse system you all helped set up. Now, our next goal is to reduce product returns. I'd like each team leader to bring three ideas to next week's meeting.",
   q:[["What is the main topic of the talk?",["Survey results","A new product","Hiring plans","A warehouse move"],0,"customer satisfaction survey results。"],
      ["Why does the speaker say, \"Believe it or not\"?",["To express surprise at an improvement","To question the survey","To disagree with the team","To introduce a joke"],0,"意図問題。いちばん苦手だった分野が最も伸びた → 驚き。"],
      ["What are team leaders asked to do?",["Bring ideas to the next meeting","Conduct another survey","Visit the warehouse","Contact customers"],0,"最後のお願いは設問3の定番。"]]},
  {k:'f',s:"This is Mike Davis with your morning traffic update. Drivers on Highway 9 should expect delays near the Riverside exit, where crews are repairing a bridge. The work is expected to continue until Friday. If you're heading downtown, consider taking Lake Road instead. Traffic is moving smoothly there. And a reminder that the city's free shuttle bus service starts next Monday, running every fifteen minutes from Central Station.",
   q:[["What is causing the delays?",["Bridge repairs","An accident","Heavy rain","A parade"],0,"crews are repairing a bridge。"],
      ["What does the speaker suggest?",["Taking another road","Leaving home later","Using the train","Working from home"],0,"consider taking Lake Road instead。"],
      ["What will start next Monday?",["A free shuttle service","Highway construction","A new radio program","Parking fees"],0,"free shuttle bus service starts next Monday。"]]},
  {k:'g',s:"Welcome to today's workshop on writing effective business e-mails. I'm Karen Hughes, and I've been teaching communication skills for over ten years. Today, we'll focus on three things: writing clear subject lines, keeping messages short, and using a polite but direct tone. In a moment, I'll hand out a worksheet with some sample e-mails. Please work in pairs to improve them. At the end of the session, I'll share a checklist you can keep at your desk.",
   q:[["What is the workshop about?",["Writing business e-mails","Public speaking","Time management","Customer service"],0,"冒頭でテーマを言う。"],
      ["What will the listeners do in pairs?",["Improve sample e-mails","Practice phone calls","Introduce each other","Write a report"],0,"work in pairs to improve them。"],
      ["What will the speaker share at the end?",["A checklist","A certificate","A book","A video"],0,"At the end of the session, I'll share a checklist。"]]},
  {k:'h',g:"Weekend Forecast|2|Day|Weather|Friday|Sunny|Saturday|Rain|Sunday|Cloudy|Monday|Sunny",s:"Hi everyone, this is Jenny from the events team. As you know, our company picnic was planned for Saturday at Green Hill Park. However, the forecast shows rain that day, so we've decided to move the picnic to the next day. It won't be sunny, but at least it'll be dry. Lunch will still be provided, and there will be games for families. Please reply to my e-mail by Thursday to tell me how many people you're bringing.",
   q:[["What event is the speaker discussing?",["A company picnic","A sports tournament","A product launch","A training session"],0,"our company picnic。"],
      ["Look at the graphic. On which day will the event be held?",["Friday","Saturday","Sunday","Monday"],2,"図表問題。the next day（土曜の翌日）→ 日曜。It won't be sunny も手がかり。"],
      ["What are listeners asked to do by Thursday?",["Reply with the number of guests","Bring food","Buy tickets","Choose a game"],0,"how many people you're bringing → number of guests。"]]},
  {k:'i',s:"Good afternoon, passengers on Sky Air Flight 512 to Vancouver. Due to a maintenance issue with our original aircraft, this flight will now depart from Gate 27 instead of Gate 14. The new departure time is 3:40 p.m. We apologize for the inconvenience. Passengers who may miss a connecting flight should speak with an agent at the transfer desk. As a thank-you for your patience, meal vouchers are available at the new gate.",
   q:[["Why has the flight changed?",["A maintenance issue","Bad weather","A crew shortage","Heavy traffic"],0,"Due to a maintenance issue。"],
      ["What are passengers with connecting flights told to do?",["Speak to an agent at the transfer desk","Go to Gate 14","Call the airline","Check the Web site"],0,"Gate 14 は元のゲートでひっかけ。"],
      ["What is available at the new gate?",["Meal vouchers","Free Wi-Fi passes","Seat upgrades","Magazines"],0,"meal vouchers＝食事券。"]]},
  {k:'j',s:"Welcome back to Business Today. Our next story is about Greenway Bikes, the local bicycle maker that has been growing quickly. The company announced yesterday that it will open twelve new stores across the country next year. That's no small task for a business that had only two shops five years ago. According to the CEO, the expansion is possible because of strong online sales. Later in the program, we'll speak with the CEO herself about the company's plans.",
   q:[["What is the news report mainly about?",["A company's expansion","A bicycle race","A new CEO","An online shopping trend"],0,"open twelve new stores → expansion。"],
      ["What does the speaker imply when he says, \"That's no small task\"?",["The plan is challenging.","The stores are small.","The company is hiring.","The task was finished."],0,"意図問題。5年前は2店舗 → 12店舗出店は大変なこと。"],
      ["What will listeners hear later in the program?",["An interview with the CEO","A weather report","A product review","Listener calls"],0,"Later in the program, we'll speak with the CEO。"]]}
];
(function lxLoad(){
  LX_P2.forEach(([q,ch,exp],i)=>{const r=i%3,c=ch.slice(1);c.splice(r,0,ch[0]);TOEIC_P2.push({id:'p2x_'+String(i+1).padStart(2,'0'),q,choices:c,correct:r,exp})});
  const conv=(arr,pre,dst)=>arr.forEach(x=>dst.push({id:pre+x.k,script:x.s,graphic:x.g||null,questions:x.q.map(([q,choices,correct,exp],i)=>({id:pre+x.k+(i+1),q,choices,correct,exp}))}));
  conv(LX_P3,'p3x_',TOEIC_P3);conv(LX_P4,'p4x_',TOEIC_P4);
})();

/* ---------- 音声：話者ごとの声・国別の発音 ---------- */
function lxAccent(id){const A=['en-US','en-GB','en-AU','en-US','en-CA'];let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))|0;return A[Math.abs(h)%A.length]}
const LX_ACCENT_JA={'en-US':'アメリカ','en-GB':'イギリス','en-AU':'オーストラリア','en-CA':'カナダ'};
function lxLines(script,narr){
  return String(script).split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const m=l.match(/^([A-Z])(\d?):\s*(.*)$/);return m?{sp:m[1]+m[2],t:m[3]}:{sp:'N',t:l}});
}
// lines を順に読む。onend は最後まで読み終えたら1回だけ呼ぶ（onend が来ない端末向けに時間で保険）
function lxSpeakLines(lines,o){
  o=o||{};let fired=false;const done=()=>{if(fired)return;fired=true;clearTimeout(lxSpeakLines._t);o.onend&&o.onend()};
  if(!('speechSynthesis'in window)||!lines.length){setTimeout(done,0);return}
  speechSynthesis.cancel();
  const words=lines.reduce((a,l)=>a+l.t.split(/\s+/).length,0);
  lines.forEach((l,i)=>{
    const u=new SpeechSynthesisUtterance(l.t);u.lang=o.lang||'en-US';u.rate=listenRate(o.rate||0.95);
    const g=l.sp[0]==='W'?'female':l.sp[0]==='M'?'male':(o.narr==='W'?'female':'male');
    const v=pickVoice(g,o.lang);if(v)u.voice=v;
    if(l.sp.endsWith('2'))u.pitch=g==='male'?0.78:1.22;
    if(i===lines.length-1)u.onend=done;
    speechSynthesis.speak(u);
  });
  clearTimeout(lxSpeakLines._t);lxSpeakLines._t=setTimeout(done,(words/(2.2*listenRate(o.rate||0.95)))*1000+lines.length*600+2500);
}
function lxSpeak(script,o){o=o||{};lxSpeakLines(lxLines(script,o.narr),o)}
function lxStop(){clearTimeout(lxSpeakLines._t);if('speechSynthesis'in window)speechSynthesis.cancel()}
function lxUnlock(){try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}}
function lxNarr(id){return String(id).charCodeAt(String(id).length-1)%2?'W':'M'}
// 既存の再生も3人会話（M2/W2）と話者ごとの声に対応させる
speakScript=function(txt){lxSpeak(txt,{rate:0.92})};

function lxGraphicHTML(g){
  // g = "タイトル|列数|見出し…|セル…"
  if(!g)return'';const a=g.split('|'),n=+a[1],c=a.slice(2),rows=[];
  for(let i=0;i<c.length;i+=n)rows.push(c.slice(i,i+n));
  return `<div class="lx-graphic"><div class="lx-graphic-t">${esc(a[0])}</div><table>${rows.map((r,i)=>`<tr>${r.map(x=>i?`<td>${esc(x)}</td>`:`<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table></div>`;
}

/* ---------- Part 3・4：本番形式 ---------- */
let lxState=null;
function lxPickSets(part,n){
  const bank=part===3?TOEIC_P3:TOEIC_P4;const t=todayStr();
  const sc=s=>{const rs=s.questions.map(q=>PROG.phrases[q.id]);if(rs.every(r=>!r||!r.views))return 0;if(rs.some(r=>r&&r.incorrect>r.correct))return 1;if(rs.some(r=>r&&r.nextReview&&r.nextReview<=t))return 2;return 3};
  return[...bank].sort(()=>Math.random()-0.5).sort((a,b)=>sc(a)-sc(b)).slice(0,n);
}
function lxOpen(part,n){
  lxUnlock();
  const sets=lxPickSets(part,n||2).map(s=>({...s,qs:s.questions.map(q=>{const r=shuffleChoices(q.choices,q.correct);return{...q,choices:r.choices,correct:r.correctIndex}})}));
  lxState={part,sets,si:0,phase:'pre',ans:{},score:0,all:[],replays:0};
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-review').classList.add('active');window.scrollTo(0,0);
  lxPhase('pre');
}
function lxSet(){return lxState.sets[lxState.si]}
function lxPhase(ph){
  const st=lxState;st.phase=ph;clearInterval(st.tm);
  const set=lxSet();
  if(ph==='pre'){st.ans={};st.left=set.graphic?20:15}
  if(ph==='listen'){lxSpeak(set.script,{lang:lxAccent(set.id),narr:lxNarr(set.id),onend:()=>{if(lxState===st&&st.phase==='listen')lxPhase('answer')}})}
  if(ph==='answer')st.left=set.graphic?30:24;
  lxRender();
  if(ph==='pre'||ph==='answer')st.tm=setInterval(()=>{
    if(lxState!==st||!document.getElementById('lx-root')){clearInterval(st.tm);return}
    st.left--;const el=document.getElementById('lx-left');if(el){el.textContent=Math.max(0,st.left);el.parentElement.classList.toggle('over',st.left<=5)}
    if(st.left<=0){clearInterval(st.tm);if(st.phase==='pre')lxPhase('listen')}
  },1000);
}
function lxRender(){
  const st=lxState,set=lxSet(),el=document.getElementById('screen-review');
  const P=st.part===3?'Part 3 · 会話':'Part 4 · 説明文';
  const banner={
    pre:`<div class="lx-banner"><b>設問を先読み</b><span class="lx-cnt">残り <i id="lx-left">${st.left}</i> 秒</span><small>本番も音声の前に設問を読みます。何を聞き取ればいいかを先に決めておく。</small><button class="btn btn-gold btn-block" id="lx-go" style="margin-top:10px">${ICONS.play} 音声スタート</button></div>`,
    listen:`<div class="lx-banner lx-on"><b>${ICONS.play} 再生中</b><span class="lx-eq"><i></i><i></i><i></i><i></i></span><small>本番と同じく音声は1回だけ。聞きながら解答してOK。（${LX_ACCENT_JA[lxAccent(set.id)]}の発音）</small></div>`,
    answer:`<div class="lx-banner"><b>解答時間</b><span class="lx-cnt">残り <i id="lx-left">${st.left}</i> 秒</span><small>本番は1問8秒。迷ったら勘で選んで次のセットの先読みへ。</small></div>`,
    review:''
  }[st.phase];
  const rv=st.phase==='review';
  el.innerHTML=`<div id="lx-root">
    <div class="back-row"><button class="icon-btn" id="lx-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>${P}</h2><span class="gw-q-meta" style="margin-left:auto">セット ${st.si+1}/${st.sets.length}</span></div>
    <div class="q-prog"><div class="q-prog-fill" style="width:${(st.si+(rv?1:0))/st.sets.length*100}%"></div></div>
    ${banner}
    ${lxGraphicHTML(set.graphic)}
    ${set.qs.map((q,k)=>{const a=st.ans[k];return`<div class="lx-q"><div class="lx-q-t">${k+1}. ${esc(q.q)}</div>
      ${q.choices.map((c,i)=>{let cls='';if(rv){if(i===q.correct)cls='q-perfect';else if(i===a)cls='q-ng'}else if(i===a)cls='lx-sel';
        return`<button class="choice-btn lx-c ${cls}" data-q="${k}" data-i="${i}" ${rv?'disabled':''}>${esc(c)}</button>`}).join('')}
      ${rv?`<div class="lx-exp">${a===q.correct?'⭕':'❌'} ${esc(q.exp)}</div>`:''}</div>`}).join('')}
    ${rv?`<div class="card lx-script"><div class="p6-k">Script</div>${lxLines(set.script,lxNarr(set.id)).map(l=>`<div><b>${l.sp==='N'?'':esc(l.sp.replace('2',' 2'))+'：'}</b>${esc(l.t)}</div>`).join('')}</div>
      <div class="lx-row"><button class="btn btn-secondary" id="lx-replay">${ICONS.play} もう一度聞く</button><button class="btn btn-secondary" id="lx-shadow">${ICONS.zap} この音声でシャドーイング</button></div>
      <button class="btn btn-gold btn-block" id="lx-next" style="margin-top:10px">${st.si+1<st.sets.length?'次のセットへ':'結果を見る'} ${ICONS.arrowRight}</button>`
    :st.phase!=='pre'?`<button class="btn btn-gold btn-block" id="lx-check" style="margin-top:12px">答え合わせ</button>`:''}
  </div>`;
  document.getElementById('lx-back').onclick=()=>{lxStop();clearInterval(st.tm);lxState=null;go('home')};
  const g=document.getElementById('lx-go');if(g)g.onclick=()=>lxPhase('listen');
  el.querySelectorAll('.lx-c').forEach(b=>b.onclick=()=>{if(st.phase==='pre')return;st.ans[+b.dataset.q]=+b.dataset.i;sfx('tap');
    b.parentElement.querySelectorAll('.lx-c').forEach(x=>x.classList.toggle('lx-sel',x===b))});
  const ck=document.getElementById('lx-check');if(ck)ck.onclick=lxCheck;
  const rp=document.getElementById('lx-replay');if(rp)rp.onclick=()=>lxSpeak(set.script,{lang:lxAccent(set.id),narr:lxNarr(set.id)});
  const sh=document.getElementById('lx-shadow');if(sh)sh.onclick=()=>{lxStop();lxShadowOpen({id:set.id,script:set.script,lang:lxAccent(set.id),narr:lxNarr(set.id),title:P},{back:'lx'})};
  const nx=document.getElementById('lx-next');if(nx)nx.onclick=lxNext;
  if(rv)window.scrollTo(0,0);
}
function lxCheck(){
  const st=lxState,set=lxSet();lxStop();clearInterval(st.tm);
  let c=0;set.qs.forEach((q,k)=>{const ok=st.ans[k]===q.correct;if(ok)c++;
    const rec=PROG.phrases[q.id]||(PROG.phrases[q.id]=newPhraseRec());rec.views++;if(ok){rec.correct++;srsGrade(rec,2)}else{rec.incorrect++;srsGrade(rec,0)}
    st.all.push({id:q.id,q:q.q,choices:q.choices,correct:q.correct,exp:q.exp})});
  st.score+=c;commit();sfx(c===set.qs.length?'correct':c?'tap':'wrong');
  lxPhase('review');
}
function lxNext(){
  const st=lxState;lxStop();
  if(st.si+1<st.sets.length){st.si++;return lxPhase('pre')}
  toeicDrillState={items:st.all,i:st.all.length,score:st.score,title:(st.part===3?'Part 3 · 会話':'Part 4 · 説明文')+'（本番形式）',part:st.part};
  const last=lxSet();lxState=null;
  renderTOEICDrillResult();
  const card=document.querySelector('#screen-review .result-card');
  if(card){const b=document.createElement('button');b.className='btn btn-secondary btn-block';b.style.marginTop='10px';b.innerHTML=`${ICONS.zap} 最後の音声でシャドーイング`;
    b.onclick=()=>lxShadowOpen({id:last.id,script:last.script,lang:lxAccent(last.id),narr:lxNarr(last.id),title:st.part===3?'Part 3':'Part 4'},{back:'home'});
    card.insertBefore(b,card.querySelector('.btn'))}
}

/* ---------- 模試・Part 1 を音声のみに ---------- */
function lxMockSetItems(part,set){
  return set.questions.map((q,k)=>({id:q.id,part,promptHTML:lxGraphicHTML(set.graphic),question:q.q,choices:q.choices,correct:q.correct,exp:q.exp,_script:set.script,_set:set.id,_first:k===0}));
}
function lxMockAudio(q){
  if(q.part===3||q.part===4)return()=>lxSpeak(q._script,{lang:lxAccent(q._set),narr:lxNarr(q._set)});
  const L=q.choices.map((c,i)=>({sp:i%2?'M':'W',t:'ABCD'[i]+'. '+c}));
  if(q.part===2)return()=>lxSpeakLines([{sp:'W',t:q._q}].concat(L.map(l=>({...l,sp:'M'}))),{});
  return()=>lxSpeakLines(L.map(l=>({...l,sp:'M'})),{});
}
function lxInstallMock(){
  startMock=function(){
    lxUnlock();
    const b=buildMockPool();
    const sets=(bank,part,n)=>sample(bank,n).flatMap(s=>lxMockSetItems(part,s));
    const p2=sample(b.p2,6).map(x=>({...x,_q:x.question.replace(/^Q:\s*/,''),question:'音声を聞いて、最も適切な応答を選んでください。'}));
    // 30問：L（P1 3・P2 6・P3 2セット・P4 2セット＝21）＋R（P5 6・P6 1・P7 2＝9）。リスニングは音声のみ
    let items=[...sample(b.p1,3),...p2,...sets(TOEIC_P3,3,2),...sets(TOEIC_P4,4,2),...sample(b.p5,6),...sample(b.p6,1),...sample(b.p7,2)];
    items=items.map(it=>{const s=shuffleChoices(it.choices,it.correct);return{...it,choices:s.choices,correct:s.correctIndex,ans:null}});
    const dur=20*60;
    mockState={items,i:0,answers:{},startedAt:Date.now(),remain:dur,dur,_played:{}};
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('screen-review').classList.add('active');window.scrollTo(0,0);
    if(mockTimer)clearInterval(mockTimer);
    mockTimer=setInterval(()=>{mockState.remain--;updateMockTimer();if(mockState.remain<=0){clearInterval(mockTimer);finishMock(true)}},1000);
    renderMockStep();
  };
  const _rms=renderMockStep;
  renderMockStep=function(){
    _rms.apply(this,arguments);
    const st=mockState;if(!st)return;const q=st.items[st.i];if(!q||q.part>4)return;
    const qt=document.querySelector('#screen-review .q-text');
    if(q.part<=2)document.querySelectorAll('#td-choices .choice-btn').forEach((b,i)=>{b.textContent='（音声を聞いて選ぶ）'});
    const key=q._set||q.id,play=lxMockAudio(q);
    if(qt)qt.insertAdjacentHTML('beforebegin',`<div class="lx-mock-play"><button class="icon-btn" id="lx-mplay" aria-label="音声を再生">${ICONS.play}</button><span>${q.part<=2?'選択肢も音声だけ（本番と同じ）':'スクリプトは表示されません（本番と同じ）'}</span></div>`);
    document.getElementById('lx-mplay').onclick=play;
    if(!st._played[key]){st._played[key]=1;setTimeout(play,250)}
  };
  const _fm=finishMock;finishMock=function(){lxStop();return _fm.apply(this,arguments)};
  const _qm=quitMock;quitMock=function(){lxStop();return _qm.apply(this,arguments)};
}
function lxInstallP1(){
  const _r=renderP1Step;
  renderP1Step=function(){
    _r.apply(this,arguments);
    const st=toeicDrillState;if(!st||st.i>=st.items.length)return;const q=st.items[st.i];
    document.querySelectorAll('#td-choices [data-tdi] span').forEach((s,i)=>{s.dataset.t=s.textContent;s.textContent='（音声を聞いて選ぶ）'});
    lxUnlock();setTimeout(()=>lxSpeakLines(q.choices.map((c,i)=>({sp:'M',t:'ABCD'[i]+'. '+c})),{}),300);
  };
  const _a=answerP1;
  answerP1=function(){document.querySelectorAll('#td-choices [data-tdi] span').forEach(s=>{if(s.dataset.t)s.textContent=s.dataset.t});return _a.apply(this,arguments)};
}

/* ---------- シャドーイング（4ステップ） ---------- */
let lxSh=null;
function lxSentences(script,narr){
  // Mr. / Ms. / p.m. などの略語のピリオドでは文を切らない
  const prot=t=>t.replace(/\b(Mr|Ms|Mrs|Dr|St|Inc|Ltd|Jr|Co)\./g,'$1§').replace(/\b([ap])\.m\./gi,'$1§m§');
  const out=[];lxLines(script,narr).forEach(l=>(prot(l.t).match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g)||[l.t]).forEach(s=>{s=s.trim().replace(/§/g,'.');if(s)out.push({sp:l.sp,t:s})}));return out;
}
function lxShadowPick(){
  // 解いたことがある会話・説明文を優先（内容を理解した素材でやるのが効果的）。最近やったものは後回し
  const log=PROG.lxShadow||{};const t=todayStr();
  const all=[...TOEIC_P3.map(s=>({s,part:3})),...TOEIC_P4.map(s=>({s,part:4}))];
  const seen=x=>x.s.questions.some(q=>PROG.phrases[q.id]&&PROG.phrases[q.id].views);
  const sc=x=>(seen(x)?0:2)+(log[x.s.id]?(log[x.s.id].d===t?3:1):0)+Math.random();
  return all.sort((a,b)=>sc(a)-sc(b))[0];
}
function lxShadowToday(){
  lxUnlock();const p=lxShadowPick();
  lxShadowOpen({id:p.s.id,script:p.s.script,lang:lxAccent(p.s.id),narr:lxNarr(p.s.id),title:p.part===3?'Part 3':'Part 4'},{back:'home'});
}
function lxShadowOpen(src,opt){
  lxStop();
  lxSh={src,opt:opt||{},sents:lxSentences(src.script,src.narr),step:1,i:0,scores:[],reps:0,peek:false,rate:1};
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-review').classList.add('active');window.scrollTo(0,0);
  lxShRender();
}
const LX_SH_STEPS=[
  ['聞く','まず内容をつかむ。スクリプトは見ずに1回聞く。'],
  ['音読','文字を見ながら、音声と同時に声に出す（パラレル・リーディング）。音のつながりと強弱をまねる。'],
  ['シャドーイング','文字を隠して、音声の0.5秒あとを影のように追いかけて言う。完璧でなくてOK、止まらないことが大事。3回が目安。'],
  ['チェック','1文ずつ「聞く→言う」。音声認識で言えた単語を確認する。']
];
function lxShPlayAll(rate){const s=lxSh;lxSpeakLines(s.sents,{lang:s.src.lang,narr:s.src.narr,rate:0.95*(rate||s.rate)})}
function lxShRender(){
  const s=lxSh,el=document.getElementById('screen-review');if(!s)return;
  const step=LX_SH_STEPS[s.step-1];
  const bar=LX_SH_STEPS.map((x,i)=>`<span class="${i+1===s.step?'on':i+1<s.step?'done':''}">${i+1}. ${x[0]}</span>`).join('');
  const text=(hide)=>`<div class="card lx-sh-text${hide?' lx-blur':''}">${s.sents.map((x,i)=>`<button class="lx-sh-line" data-l="${i}"><b>${x.sp==='N'?'':esc(x.sp.replace('2',' 2'))}</b>${esc(x.t)}</button>`).join('')}</div>`;
  let body='';
  if(s.step===1)body=`<button class="btn btn-gold btn-block" id="lx-sh-play">${ICONS.play} 再生（${LX_ACCENT_JA[s.src.lang]||''}の発音）</button>`;
  if(s.step===2)body=`<button class="btn btn-gold btn-block" id="lx-sh-play">${ICONS.play} 音声に合わせて音読（ゆっくり）</button>${text(false)}<div class="hb-note">文をタップするとその文だけ再生します。</div>`;
  if(s.step===3)body=`<div class="lx-row"><button class="btn btn-gold" style="flex:2" id="lx-sh-play">${ICONS.play} 再生して追いかける</button><button class="btn btn-secondary" style="flex:1" id="lx-sh-rate">${s.rate}x</button></div>
    <div class="lx-reps">${[1,2,3].map(n=>`<i class="${s.reps>=n?'on':''}"></i>`).join('')}<span>${s.reps}/3 回</span></div>
    <button class="btn btn-secondary btn-block" id="lx-sh-peek" style="margin-top:8px">${s.peek?'スクリプトを隠す':'つまったらスクリプトをちら見'}</button>${s.peek?text(false):''}`;
  if(s.step===4){
    const x=s.sents[s.i],sc=s.scores[s.i];
    body=`<div class="sec-sub">文 ${s.i+1} / ${s.sents.length}</div>
      <div class="card lx-sh-one">${sc&&sc.html?sc.html:`<span class="lx-blur-t">${esc(x.t)}</span>`}${sc!=null&&sc.v!=null?`<div class="lx-sh-sc ${sc.v>=80?'ok':sc.v>=50?'mid':'ng'}">${sc.v}%</div>`:''}<div class="lx-sh-heard" id="lx-sh-heard">${sc&&sc.heard?'聞き取り結果：'+esc(sc.heard):''}</div></div>
      <div class="lx-row"><button class="btn btn-secondary" id="lx-sh-one">${ICONS.play} 聞く</button>
      ${TK_SR?`<button class="btn btn-gold" style="flex:2" id="lx-sh-say">🎤 まねして言う</button>`:`<span class="lx-self"><button class="btn btn-secondary" data-self="100">◎</button><button class="btn btn-secondary" data-self="70">○</button><button class="btn btn-secondary" data-self="40">△</button></span>`}</div>
      ${!TK_SR?'<div class="hb-note">この端末は音声認識に対応していないため、自分で評価してください（◎言えた ○だいたい △むずかしい）。</div>':''}
      <button class="btn btn-secondary btn-block" id="lx-sh-nexts" style="margin-top:8px">${s.i+1<s.sents.length?'次の文へ':'仕上げ'} ${ICONS.arrowRight}</button>`;
  }
  el.innerHTML=`<div id="lx-sh-root">
    <div class="back-row"><button class="icon-btn" id="lx-sh-back" aria-label="戻る">${ICONS.arrowLeft}</button><h2>シャドーイング</h2><span class="gw-q-meta" style="margin-left:auto">${esc(s.src.title||'')}</span></div>
    <div class="lx-steps">${bar}</div>
    <div class="lx-banner"><b>Step ${s.step}：${step[0]}</b><small>${step[1]}</small></div>
    ${body}
    ${s.step<4?`<button class="btn btn-primary btn-block" id="lx-sh-next" style="margin-top:12px">次のステップへ ${ICONS.arrowRight}</button>`:''}
    <div class="hb-note">イヤホンを使うと、自分の声と音声が混ざらず練習しやすくなります。</div>
  </div>`;
  const on=(id,f)=>{const b=document.getElementById(id);if(b)b.onclick=f};
  on('lx-sh-back',()=>{lxStop();tkStopAll&&tkStopAll();lxSh=null;go('home')});
  on('lx-sh-play',()=>{if(s.step===3){s.reps=Math.min(3,s.reps+1);lxShPlayAll();lxShRender()}else lxShPlayAll(s.step===2?0.85:1)});
  on('lx-sh-rate',()=>{s.rate=s.rate>=1.1?0.9:Math.round((s.rate+0.1)*10)/10;lxShRender()});
  on('lx-sh-peek',()=>{s.peek=!s.peek;lxShRender()});
  on('lx-sh-next',()=>{lxStop();s.step++;s.i=0;lxShRender();window.scrollTo(0,0)});
  el.querySelectorAll('.lx-sh-line').forEach(b=>b.onclick=()=>{const x=s.sents[+b.dataset.l];lxSpeakLines([x],{lang:s.src.lang,narr:s.src.narr,rate:0.85})});
  on('lx-sh-one',()=>lxSpeakLines([s.sents[s.i]],{lang:s.src.lang,narr:s.src.narr,rate:0.95*s.rate}));
  on('lx-sh-say',lxShSay);
  el.querySelectorAll('[data-self]').forEach(b=>b.onclick=()=>{s.scores[s.i]={v:+b.dataset.self,html:esc(s.sents[s.i].t)};lxShRender()});
  on('lx-sh-nexts',()=>{lxStop();if(s.i+1<s.sents.length){s.i++;lxShRender()}else lxShFinish()});
}
function lxShSay(){
  const s=lxSh,x=s.sents[s.i];lxStop();
  const btn=document.getElementById('lx-sh-say');if(btn){btn.disabled=true;btn.textContent='🎤 聞いています…'}
  tkListen({lang:'en-US',maxMs:Math.max(5000,x.t.split(/\s+/).length*900),
    onInterim:t=>{const h=document.getElementById('lx-sh-heard');if(h)h.textContent='聞き取り中：'+t},
    onDone:(text)=>{
      if(!lxSh)return;
      if(!text){s.scores[s.i]={v:null,heard:'（声が聞き取れませんでした。もう一度どうぞ）'};return lxShRender()}
      const r=tkAlign(text,x.t);
      s.scores[s.i]={v:r.score,heard:text,html:r.words.map((w,k)=>`<span class="lx-w ${r.marks[k]?'ok':'ng'}">${esc(w)}</span>`).join(' ')};
      sfx(r.score>=80?'correct':'tap');lxShRender();
    },
    onError:code=>{showToast(typeof tkSrErrorMsg==='function'?tkSrErrorMsg(code):'音声認識を開始できませんでした');s.scores[s.i]=null;lxShRender()}});
}
function lxShFinish(){
  const s=lxSh;const vals=s.scores.filter(x=>x&&x.v!=null).map(x=>x.v);
  const avg=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):null;
  const log=PROG.lxShadow||(PROG.lxShadow={});const prev=log[s.src.id];
  log[s.src.id]={d:todayStr(),n:(prev?prev.n:0)+1,best:Math.max(prev&&prev.best||0,avg||0),last:avg};
  PROG.lxShadowDays=PROG.lxShadowDays||{};PROG.lxShadowDays[todayStr()]=(PROG.lxShadowDays[todayStr()]||0)+1;
  if(typeof gwLog==='function')gwLog('shadow',{s:avg});
  commit();lxSh=null;
  const el=document.getElementById('screen-review');
  const total=Object.values(PROG.lxShadowDays).reduce((a,b)=>a+b,0);
  el.innerHTML=`${sparkHeroHTML(avg==null||avg>=70?'win':'cheer')}<div class="card result-card">
    <div class="result-score">${avg==null?'シャドーイング完了！':'発話スコア '+avg+'%'}</div>
    <div class="result-msg">${prev&&prev.last!=null&&avg!=null?`前回 ${prev.last}% → 今回 ${avg}%。`:''}同じ音声を何日かに分けて繰り返すと、聞こえる速さが上がります。これまで <b>${total}本</b> シャドーイングしました。</div>
    ${inDaySession()?sessionNavHTML():`<button class="btn btn-secondary btn-block" style="margin-top:12px" id="lx-sh-again">${ICONS.zap} 別の音声でもう1本</button><button class="btn btn-gold btn-block" style="margin-top:8px" onclick="go('home')">Home ${ICONS.arrowRight}</button>`}
  </div>`;
  const a=document.getElementById('lx-sh-again');if(a)a.onclick=lxShadowToday;
  window.scrollTo(0,0);
}

/* ---------- 既存機能への接続 ---------- */
function lxInstall(){
  openTOEICP3=function(){lxOpen(3,2)};
  openTOEICP4=function(){lxOpen(4,2)};
  lxInstallMock();lxInstallP1();
  // 毎日のメニュー：シャドーイングを「今日の目標」に入れる。Part 3・4 は本番形式2セット
  if(typeof P6_TASKS!=='undefined'){
    P6_TASKS.shadow={t:'シャドーイング 1本',sub:'解いた音声を4ステップで声に出す（耳と口を同時に鍛える）',m:7};
    P6_TASKS.p3={t:'Part 3 会話 2セット',sub:'本番形式：設問先読み→音声は1回だけ',m:7};
    P6_TASKS.p4={t:'Part 4 説明文 2セット',sub:'本番形式：設問先読み→図表問題も',m:7};
    P6_TASKS.mock={t:'模試 30問（20分）',sub:'リスニングは音声のみの本番形式',m:20};
    [1,2,3,4].forEach(n=>{const b=P6_MENU[n].base;if(!b.includes('shadow'))b.splice(3,0,'shadow');P6_MENU[n].extra.push('shadow')});
  }
  const _pta=planTaskAction;
  planTaskAction=function(a){if(a==='shadow')return lxShadowToday();return _pta.apply(this,arguments)};
  // TOEICタブにシャドーイングの入口
  const _rp=renderTOEICPracticeTab;
  renderTOEICPracticeTab=function(body){
    _rp.apply(this,arguments);
    const n=Object.values(PROG.lxShadowDays||{}).reduce((a,b)=>a+b,0);
    const d=document.createElement('div');
    d.innerHTML=`<button class="p6-banner lx-sh-banner" id="lx-sh-entry"><span class="p6-banner-ic">${ICONS.zap}</span><span class="p6-banner-b"><b>シャドーイング（リスニング＋発音）</b><small>解いた会話を4ステップで声に出す · これまで${n}本</small></span><span>${ICONS.arrowRight}</span></button>`;
    const node=d.firstElementChild;const p6b=body.querySelector('#p6-banner-toeic');
    if(p6b)p6b.after(node);else body.prepend(node);
    node.onclick=lxShadowToday;
  };
}
if(typeof go==='function')lxInstall();

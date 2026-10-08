/* ========== TOEIC 650 コア語彙・頻出熟語 ==========
   既存の語彙(銀/金)は上級語が多いため、650点に直結する土台を追加する。
   形式: "見出し|品詞|意味|例文|例文訳"。index.html の後に読み込み、TOEIC_VOCAB / TIERS に先頭追加する。 */
'use strict';
const TOEIC_CORE600=`available|adj|利用できる・手が空いている|Is the conference room available this afternoon?|今日の午後、会議室は使えますか？
appointment|n|予約・約束|I have a dental appointment at ten.|10時に歯医者の予約があります。
branch|n|支店|She works at our Osaka branch.|彼女は大阪支店で働いています。
receipt|n|領収書・受領|Please keep the receipt for your records.|記録用に領収書を保管してください。
colleague|n|同僚|I'll ask a colleague to help you.|同僚に手伝うよう頼みます。
supervisor|n|上司・監督者|Please talk to your supervisor first.|まず上司に相談してください。
customer|n|顧客|The customer asked for a refund.|その顧客は返金を求めた。
client|n|取引先・顧客|We are meeting a new client tomorrow.|明日、新しい取引先と会います。
product|n|製品|The new product will be released in May.|新製品は5月に発売されます。
order|v|注文する|I ordered office supplies online.|事務用品をネットで注文した。
deliver|v|配達する|The package will be delivered on Friday.|荷物は金曜日に配達されます。
shipment|n|発送・積荷|The shipment was delayed by the storm.|嵐で発送が遅れた。
warehouse|n|倉庫|The boxes are stored in the warehouse.|箱は倉庫に保管されている。
equipment|n|機器・設備|The new equipment arrived this morning.|新しい機器が今朝届いた。
repair|v|修理する|A technician will repair the copier.|技術者がコピー機を修理します。
replace|v|取り替える|We need to replace the old printer.|古いプリンターを交換する必要がある。
directions|n|道順・指示|Could you give me directions to the station?|駅までの道順を教えてもらえますか？
located|adj|位置している|The hotel is located near the airport.|ホテルは空港の近くにある。
nearby|adj|近くの|There is a nearby café.|近くにカフェがある。
reservation|n|予約|I'd like to make a reservation for two.|2名で予約したいのですが。
book|v|予約する|I booked a flight to Seattle.|シアトル行きの便を予約した。
confirm|v|確認する・確定する|Please confirm your attendance by Monday.|月曜までに出欠を確認してください。
cancel|v|取り消す|The event was canceled due to rain.|雨のためイベントは中止された。
schedule|n|予定・日程|The schedule has changed.|予定が変更になった。
reschedule|v|予定を変更する|Can we reschedule the meeting?|会議の日程を変えられますか？
meeting|n|会議|The meeting starts at nine.|会議は9時に始まる。
conference|n|会議・学会|She spoke at an international conference.|彼女は国際会議で講演した。
presentation|n|発表|He is preparing a presentation.|彼は発表の準備をしている。
handout|n|配布資料|Please take a handout.|配布資料をお取りください。
document|n|書類|Please sign this document.|この書類に署名してください。
file|v|提出する・整理保管する|You must file the report by Friday.|金曜までに報告書を提出しなければならない。
form|n|用紙・書式|Please fill out this form.|この用紙に記入してください。
sign|v|署名する|Sign at the bottom of the page.|ページの下に署名してください。
signature|n|署名|We need your signature here.|ここに署名が必要です。
copy|n|写し・部|Please make ten copies.|10部コピーしてください。
manager|n|管理者・部長|The manager approved the plan.|部長が計画を承認した。
assistant|n|助手|My assistant will call you back.|助手が折り返し電話します。
position|n|職・役職|She applied for the sales position.|彼女は営業職に応募した。
apply|v|応募する・申し込む|He applied for a new job.|彼は新しい仕事に応募した。
interview|n|面接|The interview went well.|面接はうまくいった。
experience|n|経験|Previous experience is required.|経験が必要です。
qualified|adj|資格のある・適任の|We are looking for qualified candidates.|適任の候補者を探しています。
résumé|n|履歴書|Please send your résumé by e-mail.|履歴書をメールで送ってください。
salary|n|給料|The salary depends on experience.|給料は経験によります。
benefits|n|福利厚生|The company offers good benefits.|その会社は福利厚生が充実している。
training|n|研修|New employees receive two weeks of training.|新入社員は2週間の研修を受ける。
workshop|n|講習会|I attended a marketing workshop.|マーケティングの講習会に参加した。
register|v|登録する|Please register online by Friday.|金曜までにオンラインで登録してください。
registration|n|登録|Registration closes at noon.|登録は正午に締め切られる。
fee|n|料金・手数料|There is no fee for members.|会員は無料です。
charge|n|料金・請求|There is an extra charge for delivery.|配送には追加料金がかかる。
price|n|価格|Prices will rise next month.|来月値上がりする。
discount|n|割引|Members get a ten percent discount.|会員は10%割引になる。
payment|n|支払い|Payment is due at the end of the month.|支払いは月末が期限です。
pay|v|支払う|You can pay by credit card.|クレジットカードで支払えます。
bill|n|請求書|The bill was sent by mail.|請求書は郵送された。
invoice|n|請求書・送り状|Please check the invoice carefully.|請求書をよく確認してください。
budget|n|予算|We are over budget.|予算を超えている。
cost|n|費用|The cost of shipping is high.|送料が高い。
expense|n|経費|Travel expenses will be reimbursed.|出張経費は払い戻される。
profit|n|利益|Profits increased last quarter.|前四半期に利益が増えた。
sales|n|売上・販売|Sales were higher than expected.|売上は予想より高かった。
increase|v|増える・増やす|The number of visitors increased.|来場者数が増えた。
decrease|v|減る・減らす|Costs decreased by five percent.|費用が5%減った。
improve|v|改善する|We need to improve customer service.|顧客サービスを改善する必要がある。
announce|v|発表する|The company announced a new CEO.|会社は新しいCEOを発表した。
announcement|n|お知らせ|Please listen to this announcement.|このお知らせをお聞きください。
notice|n|通知・掲示|A notice was posted on the board.|掲示板に通知が貼られた。
inform|v|知らせる|Please inform us of any changes.|変更があればお知らせください。
contact|v|連絡する|Please contact our help desk.|ヘルプデスクに連絡してください。
reply|v|返信する|I'll reply to your e-mail today.|今日メールに返信します。
attach|v|添付する|I attached the file to this e-mail.|このメールにファイルを添付しました。
forward|v|転送する|Could you forward me the message?|そのメッセージを転送してもらえますか？
request|n|依頼・要望|We received your request.|ご依頼を受け付けました。
require|v|必要とする|This job requires a driver's license.|この仕事には運転免許が必要だ。
provide|v|提供する|We provide free Wi-Fi.|無料Wi-Fiを提供しています。
offer|v|提供する・申し出る|The store offers free delivery.|その店は無料配達を行っている。
include|v|含む|Breakfast is included in the price.|朝食は料金に含まれている。
prepare|v|準備する|I'm preparing for the meeting.|会議の準備をしている。
arrange|v|手配する|I'll arrange a taxi for you.|タクシーを手配します。
organize|v|企画する・整理する|She organized the company picnic.|彼女は社内ピクニックを企画した。
plan|v|計画する|We plan to open a new store.|新店舗を開く予定だ。
project|n|事業・計画|The project will be finished in June.|その事業は6月に完了する。
task|n|作業・任務|I have several tasks to finish today.|今日終えるべき作業がいくつかある。
responsible|adj|責任がある|Who is responsible for this project?|このプロジェクトの責任者は誰ですか？
department|n|部署|She works in the sales department.|彼女は営業部で働いている。
headquarters|n|本社|Our headquarters is in Tokyo.|本社は東京にある。
office|n|事務所|The office closes at six.|事務所は6時に閉まる。
facility|n|施設|The facility will be open to the public.|その施設は一般公開される。
building|n|建物|The building is under construction.|その建物は建設中だ。
construction|n|建設・工事|Construction will begin next month.|工事は来月始まる。
renovate|v|改装する|The lobby is being renovated.|ロビーは改装中だ。
floor|n|階・床|The cafeteria is on the third floor.|社員食堂は3階にある。
elevator|n|エレベーター|The elevator is out of order.|エレベーターは故障中だ。
parking|n|駐車|Parking is free for visitors.|来客の駐車は無料です。
vehicle|n|車両|Vehicles must not park here.|ここに車両を停めてはいけない。
traffic|n|交通(量)|Traffic was heavy this morning.|今朝は道が混んでいた。
transportation|n|交通機関|Public transportation is convenient here.|ここは公共交通機関が便利だ。
flight|n|航空便|My flight was delayed.|私の便は遅れた。
departure|n|出発|The departure time is 10 a.m.|出発時刻は午前10時です。
arrival|n|到着|Please wait in the arrival lobby.|到着ロビーでお待ちください。
luggage|n|手荷物|Please don't leave your luggage unattended.|手荷物を放置しないでください。
passenger|n|乗客|Passengers should board now.|乗客の皆さまはご搭乗ください。
trip|n|旅行・出張|How was your business trip?|出張はどうでしたか？
travel|v|移動する・旅行する|He travels a lot for work.|彼は仕事でよく出張する。
accommodation|n|宿泊施設|Accommodation is provided.|宿泊施設は用意されています。
guest|n|客・宿泊客|Guests can use the pool.|宿泊客はプールを利用できる。
menu|n|献立|Could I see the menu?|メニューを見せてもらえますか？
serve|v|(料理を)出す・仕える|Lunch will be served at noon.|昼食は正午に出されます。
restaurant|n|飲食店|The restaurant is fully booked.|そのレストランは満席だ。
catering|n|仕出し|The catering company will bring lunch.|仕出し業者が昼食を持ってくる。
event|n|催し|The event was a great success.|そのイベントは大成功だった。
attend|v|出席する|Twenty people attended the seminar.|20人がセミナーに出席した。
participant|n|参加者|Each participant will receive a gift.|参加者全員に記念品が贈られる。
audience|n|聴衆|The audience enjoyed the show.|観客はショーを楽しんだ。
speaker|n|講演者|Our next speaker is Dr. Lee.|次の講演者はリー博士です。
award|n|賞|She won an award for her design.|彼女はデザインで賞を取った。
recognize|v|表彰する・認める|He was recognized for his hard work.|彼は努力を表彰された。
complete|v|完了する|Please complete the survey.|アンケートにご回答ください。
survey|n|調査・アンケート|We conducted a customer survey.|顧客調査を実施した。
result|n|結果|The results will be announced soon.|結果は近く発表される。
report|n|報告書|The report is due on Friday.|報告書は金曜締切だ。
review|v|見直す・検討する|Please review the contract.|契約書を確認してください。
check|v|確認する|Let me check my schedule.|予定を確認させてください。
decide|v|決める|We decided to hire two more people.|あと2人雇うことにした。
choose|v|選ぶ|You can choose any seat.|どの席を選んでもいい。
select|v|選ぶ|Select an option from the list.|リストから選択してください。
suggest|v|提案する|I suggest taking the train.|電車で行くことを提案します。
recommend|v|勧める|I recommend this hotel.|このホテルをお勧めします。
agree|v|同意する|We agreed on the price.|価格で合意した。
discuss|v|話し合う|Let's discuss the budget.|予算について話し合おう。
explain|v|説明する|Could you explain the rules?|規則を説明してもらえますか？
describe|v|描写する・説明する|Please describe the problem.|問題を説明してください。
mention|v|言及する|He mentioned a new project.|彼は新しい事業に触れた。
remind|v|思い出させる|Let me remind you of the deadline.|締切をお知らせしておきます。
deadline|n|締め切り|The deadline is next Monday.|締め切りは来週月曜日だ。
due|adj|期限の・予定の|The rent is due on the first.|家賃は1日が期限だ。
late|adj|遅れた|Sorry I'm late.|遅れてすみません。
delay|n|遅れ|We apologize for the delay.|遅れをお詫びします。
immediately|adv|直ちに|Please call me immediately.|すぐに電話してください。
currently|adv|現在|He is currently on vacation.|彼は現在休暇中です。
recently|adv|最近|We recently moved to a new office.|最近新しい事務所に移った。
previously|adv|以前に|She previously worked in Paris.|彼女は以前パリで働いていた。
approximately|adv|およそ|The trip takes approximately two hours.|移動はおよそ2時間かかる。
especially|adv|特に|The park is crowded, especially on weekends.|特に週末は公園が混む。
frequently|adv|頻繁に|This question is frequently asked.|この質問はよく聞かれる。
regularly|adv|定期的に|Machines are checked regularly.|機械は定期的に点検される。
unfortunately|adv|残念ながら|Unfortunately, the item is sold out.|残念ながらその商品は売り切れです。
however|adv|しかしながら|The plan is good. However, it is expensive.|計画は良い。しかし費用が高い。
therefore|adv|したがって|Sales fell. Therefore, we cut costs.|売上が落ちた。したがって経費を削減した。
additional|adj|追加の|There is no additional charge.|追加料金はかかりません。
extra|adj|余分の|Do you need an extra chair?|椅子がもう1つ必要ですか？
several|adj|いくつかの|I made several calls.|何本か電話をかけた。
entire|adj|全体の|The entire staff attended.|職員全員が出席した。
local|adj|地元の|We buy from local farms.|地元の農場から仕入れている。
popular|adj|人気のある|This model is very popular.|このモデルはとても人気がある。
convenient|adj|便利な・都合のよい|Is Tuesday convenient for you?|火曜日はご都合いいですか？
necessary|adj|必要な|Is a reservation necessary?|予約は必要ですか？
possible|adj|可能な|Please reply as soon as possible.|できるだけ早く返信してください。
latest|adj|最新の|Have you seen the latest model?|最新モデルを見ましたか？
recent|adj|最近の|According to a recent survey…|最近の調査によると…
annual|adj|年1回の・年間の|The annual meeting is in June.|年次総会は6月だ。
monthly|adj|毎月の|We hold monthly meetings.|毎月会議を開いている。
full-time|adj|常勤の|She has a full-time job.|彼女は常勤の仕事をしている。
part-time|adj|非常勤の|We are hiring part-time staff.|パートスタッフを募集中です。
retail|n|小売り|He works in retail.|彼は小売業で働いている。
store|n|店|The store opens at ten.|その店は10時に開く。
item|n|品物・項目|This item is on sale.|この品物はセール中だ。
stock|n|在庫|That size is out of stock.|そのサイズは在庫切れです。
brand|n|銘柄・ブランド|Which brand do you prefer?|どのブランドが好みですか？
quality|n|品質|We focus on quality.|品質を重視している。
service|n|サービス・業務|The service was excellent.|サービスは素晴らしかった。
repairman|n|修理工|A repairman is fixing the roof.|修理工が屋根を直している。
technician|n|技術者|The technician fixed the network.|技術者がネットワークを直した。
software|n|ソフトウェア|Please update the software.|ソフトを更新してください。
website|n|ウェブサイト|Visit our website for details.|詳細はウェブサイトをご覧ください。
online|adv|オンラインで|You can order online.|オンラインで注文できます。
download|v|ダウンロードする|Download the app for free.|アプリを無料でダウンロードしてください。
password|n|パスワード|Please change your password.|パスワードを変更してください。
account|n|口座・アカウント|I opened a bank account.|銀行口座を開いた。
access|n|利用・入手(の権利)|Employees have access to the gym.|社員はジムを利用できる。
upcoming|adj|今度の|Please note the upcoming changes.|今後の変更にご注意ください。
temporarily|adv|一時的に|The store is temporarily closed.|その店は一時休業中だ。
permanent|adj|永続的な・正規の|She got a permanent position.|彼女は正社員の職を得た。
expect|v|予期する・見込む|We expect sales to rise.|売上の増加を見込んでいる。
estimate|n|見積もり|Can you give me an estimate?|見積もりを出してもらえますか？
quote|n|見積額|We got a quote from three companies.|3社から見積もりを取った。
contract|n|契約(書)|We signed a one-year contract.|1年契約を結んだ。
agreement|n|合意・契約|We reached an agreement.|合意に達した。
policy|n|方針・規定|Read the return policy.|返品規定を読んでください。
rule|n|規則|Please follow the safety rules.|安全規則に従ってください。
safety|n|安全|Safety comes first.|安全第一。
employee|n|従業員|All employees must attend.|全従業員が出席しなければならない。
staff|n|職員|The staff were very friendly.|スタッフはとても親切だった。
hire|v|雇う|We hired three new engineers.|新たに技術者を3人雇った。
retire|v|退職する|He will retire next year.|彼は来年退職する。
transfer|v|異動させる・乗り換える|She was transferred to London.|彼女はロンドンに異動になった。
promote|v|昇進させる・宣伝する|He was promoted to manager.|彼は部長に昇進した。
advertise|v|広告する|We advertise on social media.|SNSで広告を出している。
advertisement|n|広告|I saw your advertisement in the paper.|新聞で御社の広告を見ました。
campaign|n|運動・キャンペーン|The ad campaign was successful.|広告キャンペーンは成功した。
market|n|市場|The market is growing fast.|市場は急成長している。
competitor|n|競合相手|Our competitor lowered its prices.|競合他社が値下げした。
industry|n|業界|He has 20 years in the industry.|彼はこの業界で20年の経験がある。
goal|n|目標|Our goal is to double sales.|目標は売上を倍にすることだ。
success|n|成功|The launch was a success.|発売は成功だった。
opportunity|n|機会|This is a great opportunity.|これは絶好の機会だ。`;

const TOEIC_PHRASES650=`fill out|句|(用紙に)記入する|Please fill out this form.|この用紙に記入してください。
set up|句|設置する・準備する|They are setting up the stage.|彼らはステージを設営している。
pick up|句|受け取る・迎えに行く|I'll pick you up at the station.|駅に迎えに行きます。
drop off|句|届ける・降ろす|Please drop off the package at reception.|荷物を受付に届けてください。
look into|句|調べる|We will look into the problem.|その問題を調べます。
look for|句|探す|I'm looking for the manager.|部長を探しています。
look forward to|句|〜を楽しみにする|I look forward to hearing from you.|ご連絡をお待ちしております。
take part in|句|〜に参加する|Fifty people took part in the race.|50人が競走に参加した。
take place|句|開催される|The meeting will take place in Room B.|会議はB室で行われる。
take over|句|引き継ぐ|She will take over my duties.|彼女が私の業務を引き継ぐ。
be in charge of|句|〜を担当している|Who is in charge of the project?|この事業の担当は誰ですか？
be responsible for|句|〜に責任がある|He is responsible for hiring.|彼は採用を担当している。
be supposed to|句|〜することになっている|The train is supposed to arrive at five.|電車は5時に着くことになっている。
be about to|句|まさに〜するところ|The meeting is about to begin.|会議がまもなく始まる。
be eligible for|句|〜の資格がある|Members are eligible for discounts.|会員は割引を受けられる。
be available for|句|〜に対応できる|Are you available for a call?|電話に対応できますか？
according to|句|〜によると|According to the report, sales rose.|報告書によると売上が伸びた。
due to|句|〜が原因で|The flight was canceled due to fog.|霧のため欠航になった。
because of|句|〜のせいで|We were late because of traffic.|渋滞で遅れた。
instead of|句|〜の代わりに|Let's take the bus instead of a taxi.|タクシーの代わりにバスにしよう。
in addition to|句|〜に加えて|In addition to lunch, snacks are provided.|昼食に加えて軽食も出ます。
as well as|句|〜だけでなく|She speaks French as well as English.|彼女は英語だけでなく仏語も話す。
in advance|句|前もって|Please book in advance.|事前に予約してください。
on time|句|時間どおりに|The train arrived on time.|電車は時間どおりに着いた。
in time|句|間に合って|We got there in time for the show.|ショーに間に合った。
as soon as possible|句|できるだけ早く|Please reply as soon as possible.|至急ご返信ください。
by the end of|句|〜の終わりまでに|Finish it by the end of the week.|週末までに終えてください。
as of|句|〜付けで・〜現在|As of April 1, the price will change.|4月1日付で価格が変わる。
in person|句|直接・本人が|Please apply in person.|ご本人が直接お申し込みください。
on behalf of|句|〜を代表して|I'm calling on behalf of Mr. Brown.|ブラウン氏の代理でお電話しています。
out of order|句|故障中|The vending machine is out of order.|自動販売機は故障中だ。
out of stock|句|在庫切れ|The item is currently out of stock.|その商品は現在在庫切れです。
sold out|句|売り切れ|Tickets are sold out.|チケットは売り切れです。
free of charge|句|無料で|Delivery is free of charge.|配送は無料です。
at no extra cost|句|追加料金なしで|Upgrades are available at no extra cost.|追加料金なしでアップグレードできる。
make sure|句|確かめる・必ず〜する|Make sure to lock the door.|必ずドアに鍵をかけてください。
make a decision|句|決定する|We need to make a decision today.|今日決める必要がある。
make an appointment|句|予約をとる|I'd like to make an appointment.|予約を取りたいのですが。
run out of|句|〜を切らす|We've run out of paper.|紙を切らしてしまった。
get in touch with|句|〜と連絡をとる|I'll get in touch with you tomorrow.|明日ご連絡します。
keep in mind|句|心に留める|Keep in mind that the office closes early.|事務所が早く閉まることを覚えておいて。
deal with|句|対処する|She deals with customer complaints.|彼女は苦情に対応している。
carry out|句|実行する|We carried out a survey.|調査を実施した。
turn in|句|提出する|Please turn in your report.|報告書を提出してください。
hand out|句|配る|He handed out the agenda.|彼は議題を配った。
put off|句|延期する|They put off the meeting.|彼らは会議を延期した。
call off|句|中止する|The game was called off.|試合は中止になった。
go over|句|見直す・検討する|Let's go over the plan again.|計画をもう一度見直そう。
come up with|句|思いつく|She came up with a great idea.|彼女は素晴らしい案を思いついた。
sign up for|句|〜に申し込む|I signed up for the workshop.|講習会に申し込んだ。
check in|句|搭乗・宿泊手続きをする|You can check in at 3 p.m.|午後3時からチェックインできます。
check out|句|手続きをして出る・調べる|Check out the new menu.|新メニューをチェックしてね。
in charge|句|担当して|Ms. Kim is in charge today.|今日はキムさんが担当です。
for a while|句|しばらく|He was away for a while.|彼はしばらく不在だった。
right away|句|すぐに|I'll send it right away.|すぐに送ります。
so far|句|今までのところ|So far, so good.|今のところ順調です。
at least|句|少なくとも|It takes at least an hour.|少なくとも1時間かかる。
no later than|句|遅くとも〜までに|Submit it no later than Friday.|遅くとも金曜までに提出して。
prior to|句|〜より前に|Arrive prior to the start time.|開始時刻より前に到着してください。
in order to|句|〜するために|In order to save time, we took a taxi.|時間を節約するためタクシーに乗った。
regardless of|句|〜に関係なく|Anyone can join regardless of age.|年齢に関係なく誰でも参加できる。
with regard to|句|〜に関して|With regard to your request…|ご依頼の件に関しまして…
Why don't we|句|〜しませんか(提案)|Why don't we take a break?|休憩しませんか？
Would you mind|句|〜してもかまいませんか|Would you mind closing the window?|窓を閉めていただけますか？
How about|句|〜はどうですか|How about meeting on Monday?|月曜に会うのはどう？
I'd be happy to|句|喜んで〜します|I'd be happy to help.|喜んでお手伝いします。
I'm afraid|句|残念ながら〜|I'm afraid he's not here.|あいにく彼は不在です。
That's a good idea|句|いい考えですね|That's a good idea. Let's do it.|いい考えだね。そうしよう。
Not that I know of|句|私の知る限りではない|Is there a meeting today? — Not that I know of.|今日会議ある？—知る限りないよ。
It's up to you|句|あなた次第です|Where should we eat? — It's up to you.|どこで食べる？—お任せします。`;

(function tkLoadCore(){
  const parse=(src,prefix,tier)=>src.trim().split('\n').map((line,i)=>{const [w,pos,ja,ex,exja]=line.split('|');return{id:prefix+String(i+1).padStart(3,'0'),w,pos,ipa:'',ja,ex,exja,tier}});
  const have=new Set(TOEIC_VOCAB.map(v=>v.w.toLowerCase()));
  const core=parse(TOEIC_CORE600,'c6_',0).filter(v=>!have.has(v.w.toLowerCase()));
  const phr=parse(TOEIC_PHRASES650,'ph_',5);
  // 650への道順：コア → 熟語 → 銀の基礎 → 銀の実戦 → 金…
  TOEIC_VOCAB.unshift(...core,...phr);
  TIERS.unshift({id:0,name:'コア600',en:'Core 600',score:600,color:'#7cc0ff',desc:'600点までに必須の基本語'},{id:5,name:'頻出熟語',en:'Key Phrases',score:650,color:'#8fe3c0',desc:'Part 2〜7に毎回出る熟語・定型表現'});
})();

/* ========== Part 2 追加問題（本番頻出の型を網羅） ========== */
const TOEIC_P2_MORE=[
  ['Who is going to lead the training session?',['Ms. Patel from HR.','In the main hall.','It lasts two hours.'],0,'Who → 人物で答える。場所・時間は誤答。'],
  ['Where can I find the printer paper?',['Yes, I printed it.','In the supply closet.','About fifty pages.'],1,'Where → 場所。print/printer の似た音のひっかけに注意。'],
  ['When does the store close today?',['At eight o\'clock.','Close to the station.','It\'s a clothing store.'],0,'When → 時。close(閉まる/近い)の多義語ひっかけ。'],
  ['Why was the flight delayed?',['Because of the bad weather.','To Chicago.','At gate twelve.'],0,'Why → 理由(Because/To do)。行き先・場所は誤答。'],
  ['How long will the renovation take?',['About three weeks.','It\'s very long.','The lobby.'],0,'How long → 期間。long の繰り返しはひっかけ。'],
  ['How many people signed up for the seminar?',['Around thirty.','Sign here, please.','Next Monday.'],0,'How many → 数。sign の似た語に注意。'],
  ['Which room is the interview in?',['The one at the end of the hall.','Yes, I was interviewed.','At two thirty.'],0,'Which → 選択肢の特定。the one 〜 が定番の正解。'],
  ['What time does the bus leave?',['Every fifteen minutes.','I left it on the bus.','From platform three.'],0,'What time → 時刻・頻度。leave/left のひっかけ。'],
  ['Could you send me the sales figures?',['Sure, I\'ll e-mail them now.','The sales went up.','Yes, it was sent yesterday.'],0,'依頼 Could you 〜? → Sure / Of course + 行動。'],
  ['Would you like some more coffee?',['No, thanks. I\'ve had enough.','It\'s a coffee shop.','He likes it.'],0,'勧誘 Would you like 〜? → Yes, please / No, thanks。'],
  ['Why don\'t we take a short break?',['That sounds good.','Because it\'s broken.','It was short.'],0,'Why don\'t we 〜? は提案。理由で答えるのは典型的な誤答。'],
  ['Let\'s order lunch for the team.',['Good idea. I\'ll call the restaurant.','The team won.','In order.'],0,'平叙文の提案 → 賛成＋行動。order の多義語ひっかけ。'],
  ['Haven\'t you finished the report yet?',['I\'m almost done.','Yes, the report is long.','Next year.'],0,'否定疑問 → 肯定・否定は中身で判断。「ほぼ終わり」が自然。'],
  ['Isn\'t Mr. Kim joining us for dinner?',['He has another appointment.','Dinner is at seven.','Yes, he joined the company.'],0,'否定疑問。Yes/No を言わず事情を答えるのが正解になりやすい。'],
  ['You\'ve met our new director, haven\'t you?',['Not yet, actually.','She\'s the director.','At the meeting room.'],0,'付加疑問 → 事実を答える。Not yet が自然。'],
  ['The copier is out of paper again.',['I\'ll get some from the storage room.','I copied it.','Yes, the paper is white.'],0,'平叙文(問題の報告) → 解決策で応じる。'],
  ['Do you want the window seat or the aisle seat?',['The aisle, please.','Yes, I do.','It\'s by the window.'],0,'A or B 疑問 → どちらかを選ぶ。Yes/No は不正解。'],
  ['Should I print the handouts, or will you?',['I\'ll take care of it.','They\'re on the desk.','Yes, you should.'],0,'A or B の選択疑問。「私がやる」で第3の答え方。'],
  ['Is the conference room available this afternoon?',['Someone booked it until four.','It\'s on the second floor.','Yes, the conference was great.'],0,'Yes/No 疑問 → Yes/No を言わずに情報で答える正解が多い。'],
  ['Did you receive my e-mail about the schedule?',['Yes, I\'ll reply this afternoon.','By e-mail.','The schedule is full.'],0,'Did you 〜? → Yes/No＋補足。'],
  ['Where should I put these boxes?',['Just leave them by the door.','They\'re heavy boxes.','Yes, you should.'],0,'Where → 場所。leave them by the door が自然な指示。'],
  ['Who\'s responsible for ordering supplies?',['I think Ken handles that.','Yes, it\'s responsible.','They arrived yesterday.'],0,'Who → 人物。I think 〜 は「わからない系」と並ぶ頻出の正解型。'],
  ['When will the new software be installed?',['I haven\'t heard yet.','The software is new.','On every computer.'],0,'「まだ聞いていない/わからない」は疑問詞問題の万能な正解型。'],
  ['How did the presentation go?',['Very well, thank you.','By train.','At ten.'],0,'How did 〜 go? → 結果・感想。手段(By train)は誤答。'],
  ['How do I get to the parking garage?',['Take the elevator to level B1.','I got it yesterday.','About ten cars.'],0,'How do I get to 〜? → 道順。'],
  ['What did you think of the new menu?',['The desserts were excellent.','I think so.','At the café.'],0,'What did you think of 〜? → 感想。'],
  ['Can you help me move this desk?',['Sure, where do you want it?','It\'s a new desk.','I moved last year.'],0,'依頼 → Sure＋確認の質問返しも正解型。'],
  ['Would you mind closing the window?',['Not at all.','The window is open.','Yes, it\'s closed.'],0,'Would you mind 〜? → 引き受けるなら Not at all / No problem。'],
  ['I can\'t find my security badge.',['Did you check your jacket?','At the security desk.','It\'s a nice badge.'],0,'平叙文(困りごと) → 助言・質問で返す。'],
  ['The client wants to move the meeting to Friday.',['Friday works for me.','They moved last month.','At the client\'s office.'],0,'平叙文 → 都合を答える。move の多義語ひっかけ。'],
  ['Whose turn is it to clean the kitchen?',['I did it yesterday.','Turn left at the corner.','It\'s clean.'],0,'Whose → 人物。turn の多義語ひっかけ。'],
  ['How often do you check your e-mail?',['Several times a day.','By phone.','It\'s often late.'],0,'How often → 頻度。'],
  ['Where is the nearest pharmacy?',['There\'s one across the street.','Near the end of the month.','A prescription.'],0,'Where → 場所。there\'s one 〜 が定番。'],
  ['Why is the parking lot so crowded today?',['There\'s a special sale.','Park on the left.','Since this morning.'],0,'Why → 理由。because を使わない理由説明も正解になる。'],
  ['Are you going to the trade show next week?',['I haven\'t decided yet.','It was a great show.','Last week.'],0,'未定・保留型の応答は頻出の正解。'],
  ['Shall I reserve a table for six?',['Yes, please. Around seven.','The table is reserved.','Six of them.'],0,'Shall I 〜? (申し出) → Yes, please / No, thanks。'],
  ['This printer is really slow.',['Let\'s ask IT to check it.','I printed it slowly.','Yes, it\'s a printer.'],0,'平叙文の不満 → 対策を提案。'],
  ['Has the shipment from Brazil arrived?',['It\'s expected tomorrow.','Yes, I shipped it.','From Brazil.'],0,'現在完了の確認 → 状況で答える。'],
  ['What\'s the best way to contact you?',['My cell phone is best.','It\'s the best way.','In my office.'],0,'What\'s the best way 〜? → 手段。'],
  ['Didn\'t the budget meeting end at three?',['It ran late.','The budget is tight.','At the meeting.'],0,'否定疑問 → 事実(長引いた)で答える。']
];
TOEIC_P2.push(...TOEIC_P2_MORE.map((x,i)=>({id:'p2m_'+String(i+1).padStart(2,'0'),q:x[0],choices:x[1],correct:x[2],exp:x[3]})));


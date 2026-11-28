# سكريبت الفيديو (عربي)

DH Parameters · 173.4 s · 1920×1080 · 60 fps

| الوقت           | المشهد  | ما يظهر                                                   | النص                                                                               |
| --------------- | ------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 0:00.0 – 0:03.0 | المقدمة | Title 'DH Parameters', three robot-arm badges fall in     | يا هلا! اليوم: DH Parameters.                                                      |
| 0:03.0 – 0:06.0 | المقدمة | Subtitle 'كيف نوصف أي مفصل...' and the four badges        | نوصف أي مفصل بأربع أرقام بس.                                                       |
| 0:06.0 – 0:11.2 | السؤال  | 3D arm, a red question mark next to its hand              | الروبوت عنده ذراع... بس وين طرف الذراع بالضبط؟                                     |
| 0:11.2 – 0:15.6 | السؤال  | Arm turns; four badges a, α, d, θ appear                  | الحل: نوصف كل مفصل بأربع أرقام، اسمها DH Parameters.                               |
| 0:15.6 – 0:18.0 | السؤال  | Badges on screen; caption 'وأسهل من ما بتتخيل!'           | وأسهل من ما بتتخيل!                                                                |
| 0:18.0 – 0:23.4 | الشرح   | One link between two joints appears (joint i-1 first)     | ذراع روبوت بسيطة: رابط واحد اسمه Link، بين مفصلين اسمهم Joints.                    |
| 0:23.4 – 0:27.8 | الشرح   | Z axis (red) rises through each joint                     | كل Joint بيلف حوالين محور اسمه Z.                                                  |
| 0:27.8 – 0:32.6 | الشرح   | Coordinate frames (X, Z) placed on joints                 | وعلى كل مفصل بنحط نظام إحداثيات اسمه Frame.                                        |
| 0:32.6 – 0:38.1 | الشرح   | Frame i-1 slides toward frame i                           | هدفنا: ننقل Frame i-1 لحد ما يصير فوق Frame i.                                     |
| 0:38.1 – 0:44.0 | الشرح   | Card 'a' (Link length) appears; blue tape along X         | الرقم الأول a، المسافة بين محوري Z، على طول X.                                     |
| 0:44.0 – 0:50.1 | الشرح   | Link length explained; ruler-like blue tape               | اسمه Link length: طول الرابط نفسه، مثل المسطرة بين المفصلين.                       |
| 0:50.1 – 0:56.2 | الشرح   | Card 'α' (Link twist) appears; purple wedge about X       | الرقم الثاني α، الزاوية بين محوري Z، حوالين محور X.                                |
| 0:56.2 – 1:02.6 | الشرح   | Link twist explained; alpha reaches 35 degrees            | اسمه Link twist: كم الرابط ملتوي. لو α صفر، المحورين متوازيين.                     |
| 1:02.6 – 1:08.3 | الشرح   | Card 'd' (Link offset) appears; orange tape along Z       | الرقم الثالث d، المسافة بين محوري X، على طول Z.                                    |
| 1:08.3 – 1:14.1 | الشرح   | Link offset explained; d reaches 1.0                      | اسمه Link offset: كم بنطلع أو بننزل على محور Z.                                    |
| 1:14.1 – 1:20.2 | الشرح   | Card 'θ' (Joint angle) appears; green arc about Z         | الرقم الرابع θ، الزاوية بين محوري X، حوالين محور Z.                                |
| 1:20.2 – 1:26.8 | الشرح   | Joint angle explained; theta reaches 40 degrees           | اسمه Joint angle، وهو الرقم اللي المحرك بيغيّره لما المفصل يلف!                    |
| 1:26.8 – 1:33.5 | الشرح   | Transparent joint returns; four steps replayed a, α, d, θ | نرجّع المفصل الشفاف للبداية، ونعيد الخطوات: a، ثم α، ثم d، ثم θ.                   |
| 1:33.5 – 1:38.4 | الشرح   | Transparent joint lands on Joint i; check mark            | هيك انطبق على Joint i بأربع أرقام بس!                                              |
| 1:38.4 – 1:44.0 | الملخص  | Table rows fill in: Along/About, Z and X, a, α, d, θ      | هيك صار عنا جدول: كل رقم اله اسم ووظيفة.                                           |
| 1:44.0 – 1:51.4 | الملخص  | Revolute and prismatic cards; the 3n formula              | وفي نوعين مفاصل: الدوّار، متغيّره θ، والانزلاقي، متغيّره d. والباقي ثابت.          |
| 1:51.4 – 1:58.8 | المثال  | 3R arm in its book pose, (x, y) tag at the hand           | مثال عملي من الكتاب: ذراع مستوية بثلاث مفاصل دوّارة، اسمها 3R. نبغى نحسب جدولها.   |
| 1:58.8 – 2:07.2 | المثال  | Variables set to zero; frames {0} and {1} coincide        | أول خطوة: نحط المتغيرات كلها صفر، فـ Frame 0 و Frame 1 بيصيروا على بعض.            |
| 2:07.2 – 2:15.4 | المثال  | Parallel red Z axes; alpha column fills with zeros        | كل محاور Z متوازية وطالعة من الورقة، فـ α صفر لكل المفاصل.                         |
| 2:15.4 – 2:23.2 | المثال  | No offset along Z; d column fills with zeros              | وما في إزاحة على محور Z، فـ d صفر لكل المفاصل، لأن المفاصل على خط واحد.            |
| 2:23.2 – 2:33.2 | المثال  | Link lengths L1 and L2 drawn on the arm; a column fills   | المسافة بين Z1 و Z2 هي L1، وبين Z2 و Z3 هي L2، وهاي أطوال الروابط بالضبط.          |
| 2:33.2 – 2:43.4 | المثال  | All three theta variables appear; q column fills          | كل المفاصل دوّارة، فـ θ1 و θ2 و θ3 هي المتغيرات، وهاي اللي بنغيّرها لتحريك الذراع. |
| 2:43.4 – 2:47.4 | المثال  | Table complete; caption 'خلصنا جدول D-H!'                 | خلصنا جدول D-H، أربع أرقام لكل مفصل.                                               |
| 2:47.4 – 2:51.0 | الخاتمة | '4 أرقام = وصف كامل لأي مفصل' with the four badges        | أربع أرقام، وصف كامل لأي مفصل.                                                     |
| 2:51.0 – 2:53.4 | الخاتمة | MAE Academy wordmark and the arm                          | MAE Academy، شوفكم!                                                                |

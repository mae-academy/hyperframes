# Timed script for the DH-parameters film (173.4 s). Source of truth for both languages.
# Each segment: (start_s, end_s, scene, on_screen, ar, en, must_show)
#   on_screen : what the viewer sees in this slot (checked against the captions/timeline)
#   ar / en   : narration lines (no voiceover is in the video yet; these are the scripts)
#   must_show : tokens that must visibly exist on screen in this slot (checked by verify.py)

SEGMENTS = [
    # ---- INTRO (0.0 - 6.0)
    (0.0, 3.0, "intro", "Title 'DH Parameters', three robot-arm badges fall in",
     "يا هلا! اليوم: DH Parameters.",
     "Hey! Today: DH Parameters.",
     ["DH Parameters"]),
    (3.0, 6.0, "intro", "Subtitle 'كيف نوصف أي مفصل...' and the four badges",
     "نوصف أي مفصل بأربع أرقام بس.",
     "Describe any joint with four numbers.",
     []),

    # ---- HOOK (6.0 - 18.0)
    (6.0, 11.2, "hook", "3D arm, a red question mark next to its hand",
     "الروبوت عنده ذراع... بس وين طرف الذراع بالضبط؟",
     "The robot has an arm... but where exactly is its hand?",
     ["طرف الذراع"]),
    (11.2, 15.6, "hook", "Arm turns; four badges a, α, d, θ appear",
     "الحل: نوصف كل مفصل بأربع أرقام، اسمها DH Parameters.",
     "The answer: four numbers per joint, called DH Parameters.",
     ["DH Parameters"]),
    (15.6, 18.0, "hook", "Badges on screen; caption 'وأسهل من ما بتتخيل!'",
     "وأسهل من ما بتتخيل!",
     "Easier than you think!",
     []),

    # ---- DIAGRAM (18.0 - 98.4), setup
    (18.0, 23.4, "diagram", "One link between two joints appears (joint i-1 first)",
     "ذراع روبوت بسيطة: رابط واحد اسمه Link، بين مفصلين اسمهم Joints.",
     "A simple robot arm: one link between two joints.",
     ["Link", "Joints"]),
    (23.4, 27.8, "diagram", "Z axis (red) rises through each joint",
     "كل Joint بيلف حوالين محور اسمه Z.",
     "Each joint rotates around an axis called Z.",
     ["Z"]),
    (27.8, 32.6, "diagram", "Coordinate frames (X, Z) placed on joints",
     "وعلى كل مفصل بنحط نظام إحداثيات اسمه Frame.",
     "On every joint we place a coordinate system called a Frame.",
     ["Frame"]),
    (32.6, 38.1, "diagram", "Frame i-1 slides toward frame i",
     "هدفنا: ننقل Frame i-1 لحد ما يصير فوق Frame i.",
     "Our goal: move Frame i-1 until it lands exactly on Frame i.",
     ["Frame"]),

    # ---- DIAGRAM: parameter a
    (38.1, 44.0, "diagram", "Card 'a' (Link length) appears; blue tape along X",
     "الرقم الأول a، المسافة بين محوري Z، على طول X.",
     "The first number, a: the distance between the two Z axes, measured along X.",
     ["a"]),
    (44.0, 50.1, "diagram", "Link length explained; ruler-like blue tape",
     "اسمه Link length: طول الرابط نفسه، مثل المسطرة بين المفصلين.",
     "It's called link length: the link's own length, like a ruler between the joints.",
     ["Link length"]),

    # ---- DIAGRAM: parameter alpha
    (50.1, 56.2, "diagram", "Card 'α' (Link twist) appears; purple wedge about X",
     "الرقم الثاني α، الزاوية بين محوري Z، حوالين محور X.",
     "The second number, alpha: the angle between the two Z axes, around X.",
     ["α"]),
    (56.2, 62.6, "diagram", "Link twist explained; alpha reaches 35 degrees",
     "اسمه Link twist: كم الرابط ملتوي. لو α صفر، المحورين متوازيين.",
     "Link twist: how twisted the link is. Zero alpha means parallel axes.",
     ["Link twist"]),

    # ---- DIAGRAM: parameter d
    (62.6, 68.3, "diagram", "Card 'd' (Link offset) appears; orange tape along Z",
     "الرقم الثالث d، المسافة بين محوري X، على طول Z.",
     "The third number, d: the distance between the two X axes, along Z.",
     ["d"]),
    (68.3, 74.1, "diagram", "Link offset explained; d reaches 1.0",
     "اسمه Link offset: كم بنطلع أو بننزل على محور Z.",
     "It's called link offset: how far we slide up or down along Z.",
     ["Link offset"]),

    # ---- DIAGRAM: parameter theta
    (74.1, 80.2, "diagram", "Card 'θ' (Joint angle) appears; green arc about Z",
     "الرقم الرابع θ، الزاوية بين محوري X، حوالين محور Z.",
     "The fourth number, theta: the angle between the two X axes, around Z.",
     ["θ"]),
    (80.2, 86.8, "diagram", "Joint angle explained; theta reaches 40 degrees",
     "اسمه Joint angle، وهو الرقم اللي المحرك بيغيّره لما المفصل يلف!",
     "It's called joint angle: the number the motor changes when the joint turns!",
     ["Joint angle"]),

    # ---- DIAGRAM: replay and landing
    (86.8, 93.5, "diagram", "Transparent joint returns; four steps replayed a, α, d, θ",
     "نرجّع المفصل الشفاف للبداية، ونعيد الخطوات: a، ثم α، ثم d، ثم θ.",
     "We bring the transparent joint back and replay: a, then alpha, then d, then theta.",
     []),
    (93.5, 98.4, "diagram", "Transparent joint lands on Joint i; check mark",
     "هيك انطبق على Joint i بأربع أرقام بس!",
     "That's how it lands on Joint i with just four numbers!",
     ["Joint i"]),

    # ---- SUMMARY (98.4 - 111.4), table + cards (no captions in this scene)
    (98.4, 104.0, "summary", "Table rows fill in: Along/About, Z and X, a, α, d, θ",
     "هيك صار عنا جدول: كل رقم اله اسم ووظيفة.",
     "Now we have a table: each number has a name and a job.",
     []),
    (104.0, 111.4, "summary", "Revolute and prismatic cards; the 3n formula",
     "وفي نوعين مفاصل: الدوّار، متغيّره θ، والانزلاقي، متغيّره d. والباقي ثابت.",
     "Two joint types: revolute, where theta changes, and prismatic, where d changes. The rest stay fixed.",
     ["θ", "d"]),

    # ---- EXAMPLE (111.4 - 167.4), 3R planar manipulator
    (111.4, 118.8, "example", "3R arm in its book pose, (x, y) tag at the hand",
     "مثال عملي من الكتاب: ذراع مستوية بثلاث مفاصل دوّارة، اسمها 3R. نبغى نحسب جدولها.",
     "A worked example from the textbook: a flat arm with three revolute joints, called 3R.",
     ["3R"]),
    (118.8, 127.2, "example", "Variables set to zero; frames {0} and {1} coincide",
     "أول خطوة: نحط المتغيرات كلها صفر، فـ Frame 0 و Frame 1 بيصيروا على بعض.",
     "First step: set all variables to zero, so Frame 0 and Frame 1 coincide.",
     ["{0}", "{1}"]),
    (127.2, 135.4, "example", "Parallel red Z axes; alpha column fills with zeros",
     "كل محاور Z متوازية وطالعة من الورقة، فـ α صفر لكل المفاصل.",
     "All Z axes are parallel and point out of the page, so alpha is zero for every joint.",
     ["Z"]),
    (135.4, 143.2, "example", "No offset along Z; d column fills with zeros",
     "وما في إزاحة على محور Z، فـ d صفر لكل المفاصل، لأن المفاصل على خط واحد.",
     "No offset along Z, so d is zero for every joint, and the links lie in one line.",
     ["d"]),
    (143.2, 153.2, "example", "Link lengths L1 and L2 drawn on the arm; a column fills",
     "المسافة بين Z1 و Z2 هي L1، وبين Z2 و Z3 هي L2، وهاي أطوال الروابط بالضبط.",
     "The distance between Z1 and Z2 is L1, and between Z2 and Z3 is L2. Those are the link lengths.",
     ["L1", "L2"]),
    (153.2, 163.4, "example", "All three theta variables appear; q column fills",
     "كل المفاصل دوّارة، فـ θ1 و θ2 و θ3 هي المتغيرات، وهاي اللي بنغيّرها لتحريك الذراع.",
     "All joints are revolute, so theta 1, theta 2 and theta 3 are the variables, the values we change to move the arm.",
     ["θ1"]),
    (163.4, 167.4, "example", "Table complete; caption 'خلصنا جدول D-H!'",
     "خلصنا جدول D-H، أربع أرقام لكل مفصل.",
     "We finished the D-H table: four numbers per joint.",
     []),

    # ---- OUTRO (167.4 - 173.4)
    (167.4, 171.0, "outro", "'4 أرقام = وصف كامل لأي مفصل' with the four badges",
     "أربع أرقام، وصف كامل لأي مفصل.",
     "Four numbers, a complete description of any joint.",
     []),
    (171.0, 173.4, "outro", "MAE Academy wordmark and the arm",
     "MAE Academy، شوفكم!",
     "MAE Academy, see you!",
     ["MAE Academy"]),
]

# Caption cards as they actually appear in the built film (absolute start, duration), for alignment checks.
CAPTIONS = [
    (6.8, 4.4), (11.6, 4.0), (15.8, 1.9),
    (18.9, 4.3), (23.4, 4.2), (27.8, 4.5), (32.6, 4.7),
    (38.1, 5.5), (44.0, 5.2), (50.1, 5.7), (56.2, 5.4),
    (62.6, 5.3), (68.3, 5.0), (74.1, 5.9), (80.2, 6.0), (86.8, 6.2), (93.5, 4.2),
    (112.2, 6.6), (119.0, 8.0), (127.4, 7.8), (135.4, 7.6), (143.4, 9.6), (153.4, 9.6), (163.4, 3.4),
]

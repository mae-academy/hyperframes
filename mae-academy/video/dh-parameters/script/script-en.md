# Video script (English)

DH Parameters · 173.4 s · 1920×1080 · 60 fps

| Time            | Scene          | On screen                                                 | Narration                                                                                                         |
| --------------- | -------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 0:00.0 – 0:03.0 | Intro          | Title 'DH Parameters', three robot-arm badges fall in     | Hey! Today: DH Parameters.                                                                                        |
| 0:03.0 – 0:06.0 | Intro          | Subtitle 'كيف نوصف أي مفصل...' and the four badges        | Describe any joint with four numbers.                                                                             |
| 0:06.0 – 0:11.2 | Hook           | 3D arm, a red question mark next to its hand              | The robot has an arm... but where exactly is its hand?                                                            |
| 0:11.2 – 0:15.6 | Hook           | Arm turns; four badges a, α, d, θ appear                  | The answer: four numbers per joint, called DH Parameters.                                                         |
| 0:15.6 – 0:18.0 | Hook           | Badges on screen; caption 'وأسهل من ما بتتخيل!'           | Easier than you think!                                                                                            |
| 0:18.0 – 0:23.4 | Explanation    | One link between two joints appears (joint i-1 first)     | A simple robot arm: one link between two joints.                                                                  |
| 0:23.4 – 0:27.8 | Explanation    | Z axis (red) rises through each joint                     | Each joint rotates around an axis called Z.                                                                       |
| 0:27.8 – 0:32.6 | Explanation    | Coordinate frames (X, Z) placed on joints                 | On every joint we place a coordinate system called a Frame.                                                       |
| 0:32.6 – 0:38.1 | Explanation    | Frame i-1 slides toward frame i                           | Our goal: move Frame i-1 until it lands exactly on Frame i.                                                       |
| 0:38.1 – 0:44.0 | Explanation    | Card 'a' (Link length) appears; blue tape along X         | The first number, a: the distance between the two Z axes, measured along X.                                       |
| 0:44.0 – 0:50.1 | Explanation    | Link length explained; ruler-like blue tape               | It's called link length: the link's own length, like a ruler between the joints.                                  |
| 0:50.1 – 0:56.2 | Explanation    | Card 'α' (Link twist) appears; purple wedge about X       | The second number, alpha: the angle between the two Z axes, around X.                                             |
| 0:56.2 – 1:02.6 | Explanation    | Link twist explained; alpha reaches 35 degrees            | Link twist: how twisted the link is. Zero alpha means parallel axes.                                              |
| 1:02.6 – 1:08.3 | Explanation    | Card 'd' (Link offset) appears; orange tape along Z       | The third number, d: the distance between the two X axes, along Z.                                                |
| 1:08.3 – 1:14.1 | Explanation    | Link offset explained; d reaches 1.0                      | It's called link offset: how far we slide up or down along Z.                                                     |
| 1:14.1 – 1:20.2 | Explanation    | Card 'θ' (Joint angle) appears; green arc about Z         | The fourth number, theta: the angle between the two X axes, around Z.                                             |
| 1:20.2 – 1:26.8 | Explanation    | Joint angle explained; theta reaches 40 degrees           | It's called joint angle: the number the motor changes when the joint turns!                                       |
| 1:26.8 – 1:33.5 | Explanation    | Transparent joint returns; four steps replayed a, α, d, θ | We bring the transparent joint back and replay: a, then alpha, then d, then theta.                                |
| 1:33.5 – 1:38.4 | Explanation    | Transparent joint lands on Joint i; check mark            | That's how it lands on Joint i with just four numbers!                                                            |
| 1:38.4 – 1:44.0 | Summary        | Table rows fill in: Along/About, Z and X, a, α, d, θ      | Now we have a table: each number has a name and a job.                                                            |
| 1:44.0 – 1:51.4 | Summary        | Revolute and prismatic cards; the 3n formula              | Two joint types: revolute, where theta changes, and prismatic, where d changes. The rest stay fixed.              |
| 1:51.4 – 1:58.8 | Worked example | 3R arm in its book pose, (x, y) tag at the hand           | A worked example from the textbook: a flat arm with three revolute joints, called 3R.                             |
| 1:58.8 – 2:07.2 | Worked example | Variables set to zero; frames {0} and {1} coincide        | First step: set all variables to zero, so Frame 0 and Frame 1 coincide.                                           |
| 2:07.2 – 2:15.4 | Worked example | Parallel red Z axes; alpha column fills with zeros        | All Z axes are parallel and point out of the page, so alpha is zero for every joint.                              |
| 2:15.4 – 2:23.2 | Worked example | No offset along Z; d column fills with zeros              | No offset along Z, so d is zero for every joint, and the links lie in one line.                                   |
| 2:23.2 – 2:33.2 | Worked example | Link lengths L1 and L2 drawn on the arm; a column fills   | The distance between Z1 and Z2 is L1, and between Z2 and Z3 is L2. Those are the link lengths.                    |
| 2:33.2 – 2:43.4 | Worked example | All three theta variables appear; q column fills          | All joints are revolute, so theta 1, theta 2 and theta 3 are the variables, the values we change to move the arm. |
| 2:43.4 – 2:47.4 | Worked example | Table complete; caption 'خلصنا جدول D-H!'                 | We finished the D-H table: four numbers per joint.                                                                |
| 2:47.4 – 2:51.0 | Outro          | '4 أرقام = وصف كامل لأي مفصل' with the four badges        | Four numbers, a complete description of any joint.                                                                |
| 2:51.0 – 2:53.4 | Outro          | MAE Academy wordmark and the arm                          | MAE Academy, see you!                                                                                             |

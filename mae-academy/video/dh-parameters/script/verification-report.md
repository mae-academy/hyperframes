# Verification report

## Timing and text checks (verify.py)

```
  #  start    end scene     slot  AR s   AR%  EN s   EN%
  1    0.0    3.0 intro      3.0  2.54   85%  1.95   65%
  2    3.0    6.0 intro      3.0  2.70   90%  2.43   81%
  3    6.0   11.2 hook       5.2  3.52   68%  4.50   87%
  4   11.2   15.6 hook       4.4  3.92   89%  3.52   80%
  5   15.6   18.0 hook       2.4  1.88   78%  1.70   71%
  6   18.0   23.4 diagram    5.4  4.74   88%  3.52   65%
  7   23.4   27.8 diagram    4.4  3.11   71%  3.16   72%
  8   27.8   32.6 diagram    4.8  3.52   73%  4.25   89%
  9   32.6   38.1 diagram    5.5  4.33   79%  4.61   84%
 10   38.1   44.0 diagram    5.9  4.33   73%  5.34   91%
 11   44.0   50.1 diagram    6.1  4.33   71%  5.34   88%
 12   50.1   56.2 diagram    6.1  4.33   71%  4.98   82%
 13   56.2   62.6 diagram    6.4  4.99   78%  4.86   76%
 14   62.6   68.3 diagram    5.7  4.33   76%  4.98   87%
 15   68.3   74.1 diagram    5.8  4.33   75%  4.98   86%
 16   74.1   80.2 diagram    6.1  4.33   71%  4.98   82%
 17   80.2   86.8 diagram    6.6  4.74   72%  4.98   75%
 18   86.8   93.5 diagram    6.7  5.56   83%  5.70   85%
 19   93.5   98.4 diagram    4.9  3.52   72%  4.25   87%
 20   98.4  104.0 summary    5.6  3.92   70%  4.98   89%
 21  104.0  111.4 summary    7.4  4.99   67%  6.32   85%
 22  111.4  118.8 example    7.4  6.21   84%  5.70   77%
 23  118.8  127.2 example    8.4  6.37   76%  5.34   64%
 24  127.2  135.4 example    8.2  5.15   63%  6.80   83%
 25  135.4  143.2 example    7.8  6.78   87%  6.80   87%
 26  143.2  153.2 example   10.0  7.19   72%  7.77   78%
 27  153.2  163.4 example   10.2  6.78   66%  8.61   84%
 28  163.4  167.4 example    4.0  3.11   78%  3.52   88%
 29  167.4  171.0 outro      3.6  2.70   75%  3.16   88%
 30  171.0  173.4 outro      2.4  1.47   61%  1.70   71%

mode: estimated (AR 2.45 / EN 2.75 words/s)
segments: 30   film: 173.4s   AR speech total: 129.7s   EN speech total: 140.8s
errors: 0   warnings: 0
```

Speech times are **estimates** (words ÷ rate + pauses). To check the real voice, generate each line, write the measured seconds to `script/measured.json` as `{"<segment number>": {"ar": s, "en": s}}`, and run `python3 script/verify.py` again.

## Claim vs. frame check

| #   | Narration claim        | Frame check (snapshot inside the slot)         |
| --- | ---------------------- | ---------------------------------------------- |
| 1   | t=1.5 title + badges   | shot 3s: title, badges                         |
| 3   | question about hand    | shot 9s: question caption                      |
| 6   | one link, two joints   | shot 21s: link + Joint i-1, Joint i            |
| 7   | Z axis on joint        | shot 27s: red Z through joint                  |
| 8   | frames placed          | shot 33s: frames {i-1},{i}                     |
| 10  | card a, value 0 -> 3.4 | shot 39s: a=0.0; shot 45s: a=3.4               |
| 12  | card alpha             | shot 51s: alpha=0; shot 57s: alpha=35 deg      |
| 14  | card d, value to 1.0   | shot 63s: d=0.0; shot 69s: d=1.0               |
| 16  | card theta, arc        | shot 75s: theta=0; shot 81s: theta=40 deg      |
| 18  | replay a,alpha,d,theta | shot 87s: transparent joint mid-replay         |
| 19  | lands on Joint i       | shot 93s: landed, values 3.4/35/1.0/40         |
| 20  | table fills in         | shot 99s: table empty; shot 105s: filled       |
| 21  | revolute / prismatic   | shot 105s: revolute card; prismatic card later |
| 22  | 3R arm, book pose      | shot 111s: 3R arm, (x,y) tag                   |
| 23  | frames {0}={1}         | shot 123s: {0} = {1} badge                     |
| 24  | Z parallel, alpha=0    | shot 129s: parallel Z, alpha column zeros      |
| 25  | d=0 everywhere         | shot 141s: d = 0 card, d column zeros          |
| 26  | L1 and L2 labels       | shot 147s: L1, L2 on links; 153s: a column     |
| 27  | theta1..3 variables    | shot 159s: theta labels, q column              |
| 28  | table complete         | shot 165s: full table                          |
| 29  | 4 numbers line         | shot 165s/171s: '4 numbers' card               |
| 30  | MAE Academy            | shot 171s: MAE Academy wordmark                |

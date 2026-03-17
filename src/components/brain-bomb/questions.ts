// ===== Brain Bomb — Question Bank =====
import type { Question, Difficulty } from './types';

type QuestionBank = Record<string, Question[]>;

export const QUESTIONS: QuestionBank = {
  // ── MATH ──────────────────────────────────────────────────────────
  // math_arithmetic: [
    // { q: 'What is 6 + 9?', a: ['14','15','16','13'], correct: 1, diff: 'easy' },
    // { q: 'What is 12 \u00d7 3?', a: ['36','33','39','30'], correct: 0, diff: 'easy' },
    // { q: 'What is 48 \u00f7 6?', a: ['6','7','8','9'], correct: 2, diff: 'easy' },
    // { q: 'What is 25 + 37?', a: ['52','62','72','61'], correct: 1, diff: 'easy' },
    // { q: 'What is 17 \u00d7 4?', a: ['68','72','64','56'], correct: 0, diff: 'medium' },
    // { q: 'What is 144 \u00f7 12?', a: ['11','13','12','14'], correct: 2, diff: 'medium' },
    // { q: 'What is 7\u00b2 + 5\u00b2?', a: ['74','49','98','25'], correct: 0, diff: 'medium' },
    // { q: 'What is 256 \u00f7 16?', a: ['14','15','16','18'], correct: 2, diff: 'medium' },
    // { q: 'What is 2\u2078?', a: ['128','256','64','512'], correct: 1, diff: 'hard' },
    // { q: 'What is \u221a169?', a: ['11','12','13','14'], correct: 2, diff: 'hard' },
    // { q: 'If x + 7 = 23, what is x?', a: ['14','15','16','17'], correct: 2, diff: 'hard' },
    // { q: 'What is 19 \u00d7 21?', a: ['389','399','401','379'], correct: 1, diff: 'hard' },
  // ],
  // math_fractions: [
    // { q: 'What is 1/2 + 1/2?', a: ['1','1/4','2','1/2'], correct: 0, diff: 'easy' },
    // { q: 'What is 3/4 of 8?', a: ['4','5','6','7'], correct: 2, diff: 'easy' },
    // { q: 'What is 1/3 of 12?', a: ['3','4','6','2'], correct: 1, diff: 'easy' },
    // { q: 'What is 1/4 + 1/4?', a: ['1/2','1/4','2/4','1/8'], correct: 0, diff: 'easy' },
    // { q: 'What is 3/4 + 1/3?', a: ['13/12','7/6','4/7','11/12'], correct: 0, diff: 'medium' },
    // { q: 'What is 2/3 \u00d7 3/4?', a: ['1/2','2/7','6/12','5/12'], correct: 0, diff: 'medium' },
    // { q: 'What is 5/8 + 1/4?', a: ['7/8','6/8','3/4','5/6'], correct: 0, diff: 'medium' },
    // { q: 'What is 7/10 - 2/5?', a: ['3/10','1/2','2/10','5/10'], correct: 0, diff: 'medium' },
    // { q: 'What is 5/6 - 1/4?', a: ['7/12','2/3','4/6','8/12'], correct: 0, diff: 'hard' },
    // { q: 'Simplify 18/24:', a: ['3/4','2/3','6/8','9/12'], correct: 0, diff: 'hard' },
    // { q: 'What is 2/3 \u00f7 4/5?', a: ['5/6','8/15','10/12','6/5'], correct: 0, diff: 'hard' },
    // { q: 'What is 3 1/2 + 2 3/4?', a: ['6 1/4','5 3/4','6 1/2','5 1/4'], correct: 0, diff: 'hard' },
  // ],
  // math_percent: [
    // { q: 'What is 50% of 20?', a: ['5','10','15','20'], correct: 1, diff: 'easy' },
    // { q: 'What is 10% of 70?', a: ['7','14','17','70'], correct: 0, diff: 'easy' },
    // { q: 'What is 25% of 40?', a: ['5','10','15','20'], correct: 1, diff: 'easy' },
    // { q: 'What is 100% of 50?', a: ['100','50','25','500'], correct: 1, diff: 'easy' },
    // { q: 'What is 15% of 80?', a: ['10','14','12','16'], correct: 2, diff: 'medium' },
    // { q: 'What is 35% of 200?', a: ['60','65','70','75'], correct: 2, diff: 'medium' },
    // { q: 'What is 20% of 150?', a: ['20','25','30','35'], correct: 2, diff: 'medium' },
    // { q: 'What is 75% of 120?', a: ['80','90','95','85'], correct: 1, diff: 'medium' },
    // { q: 'A $120 item is 25% off. Final price?', a: ['$80','$85','$90','$95'], correct: 2, diff: 'hard' },
    // { q: 'Price went from 40 to 50. % increase?', a: ['20%','25%','10%','15%'], correct: 1, diff: 'hard' },
    // { q: 'After 30% discount, price is $56. Original?', a: ['$72','$80','$84','$75'], correct: 1, diff: 'hard' },
    // { q: '60 is what percent of 240?', a: ['20%','25%','30%','15%'], correct: 1, diff: 'hard' },
  // ],
  // math_missing: [
    // { q: '_ + 5 = 11', a: ['5','6','7','4'], correct: 1, diff: 'easy' },
    // { q: '3 \u00d7 _ = 18', a: ['4','5','6','7'], correct: 2, diff: 'easy' },
    // { q: '_ - 3 = 9', a: ['10','11','12','13'], correct: 2, diff: 'easy' },
    // { q: '20 \u00f7 _ = 5', a: ['3','4','5','6'], correct: 1, diff: 'easy' },
    // { q: '_ \u00d7 7 = 56', a: ['6','7','8','9'], correct: 2, diff: 'medium' },
    // { q: '24 \u00f7 _ = 6', a: ['3','4','5','6'], correct: 1, diff: 'medium' },
    // { q: '_ + 17 = 45', a: ['26','27','28','29'], correct: 2, diff: 'medium' },
    // { q: '_ \u00d7 9 = 108', a: ['11','12','13','14'], correct: 1, diff: 'medium' },
    // { q: '_ \u00b2 = 144', a: ['10','11','12','13'], correct: 2, diff: 'hard' },
    // { q: '2_ + 5 = 41 (2_ means 2\u00d7_)', a: ['16','17','18','19'], correct: 2, diff: 'hard' },
    // { q: '_ \u00b3 = 27', a: ['2','3','4','9'], correct: 1, diff: 'hard' },
    // { q: '5_ - 12 = 48 (5_ means 5\u00d7_)', a: ['10','11','12','13'], correct: 2, diff: 'hard' },
  // ],

  // ── LOGIC ─────────────────────────────────────────────────────────
  // logic_patterns: [
    // { q: '2, 4, 6, 8, ?', a: ['9','10','11','12'], correct: 1, diff: 'easy' },
    // { q: '1, 3, 5, 7, ?', a: ['8','9','10','11'], correct: 1, diff: 'easy' },
    // { q: '5, 10, 15, 20, ?', a: ['22','25','30','24'], correct: 1, diff: 'easy' },
    // { q: '10, 20, 30, 40, ?', a: ['45','50','55','60'], correct: 1, diff: 'easy' },
    // { q: '2, 4, 8, 16, ?', a: ['24','30','32','18'], correct: 2, diff: 'medium' },
    // { q: '1, 1, 2, 3, 5, ?', a: ['7','8','9','6'], correct: 1, diff: 'medium' },
    // { q: '3, 9, 27, 81, ?', a: ['162','243','324','108'], correct: 1, diff: 'medium' },
    // { q: '1, 4, 9, 16, ?', a: ['20','24','25','36'], correct: 2, diff: 'medium' },
    // { q: 'Z, X, V, T, ?', a: ['Q','R','S','P'], correct: 1, diff: 'hard' },
    // { q: '3, 6, 12, 24, ?', a: ['36','42','48','28'], correct: 2, diff: 'hard' },
    // { q: '2, 6, 18, 54, ?', a: ['108','162','216','72'], correct: 1, diff: 'hard' },
    // { q: '0, 1, 1, 2, 3, 5, 8, ?', a: ['11','12','13','14'], correct: 2, diff: 'hard' },
  // ],
  logic_truefalse: [
    { q: 'Is 7 an even number?', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is a square a rectangle?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 0 a positive number?', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is 15 divisible by 5?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is a triangle a polygon?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Does a circle have corners?', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is 100 greater than 99?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 1 the smallest prime number?', a: ['True','False \u2014 1 is not prime','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'If A > B and B > C, is A > C?', a: ['True','False','Maybe','Can\'t tell'], correct: 0, diff: 'medium' },
    { q: 'All primes are odd. True?', a: ['True','False \u2014 2 is prime','Only sometimes','Depends'], correct: 1, diff: 'medium' },
    { q: 'Every rectangle is a square. True?', a: ['True','False','Sometimes','Always'], correct: 1, diff: 'medium' },
    { q: 'The sum of two odd numbers is always odd.', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'medium' },
    { q: 'An even number plus an even number is always even.', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Multiplying any number by 0 gives 0. True?', a: ['True','False','Sometimes','Only for positives'], correct: 0, diff: 'medium' },
    { q: 'A triangle can have two right angles. True?', a: ['True','False','Sometimes','In 3D only'], correct: 1, diff: 'medium' },
    { q: 'Dividing by 1 always gives the same number. True?', a: ['True','False','Sometimes','Only for integers'], correct: 0, diff: 'medium' },
    { q: 'If NOT (A AND B) is true, A must be false. True?', a: ['True','False \u2014 B could be false','Always true','Never true'], correct: 1, diff: 'hard' },
    { q: 'x\u00b2 is always positive. True?', a: ['True','False \u2014 0\u00b2 = 0','Sometimes','Usually'], correct: 1, diff: 'hard' },
    { q: 'If a number is divisible by 6, it is divisible by 3.', a: ['True','False','Sometimes','Only evens'], correct: 0, diff: 'hard' },
    { q: '\u221a(a\u00b2 + b\u00b2) = a + b. True?', a: ['True','False','Only if a=0','Only if b=0'], correct: 1, diff: 'hard' },
    { q: 'If A OR B is false, both A and B must be false.', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'hard' },
    { q: 'The product of two negative numbers is negative. True?', a: ['True','False \u2014 it is positive','Sometimes','Only with integers'], correct: 1, diff: 'hard' },
    { q: 'If A implies B, then NOT B implies NOT A. True?', a: ['True','False','Sometimes','Only for numbers'], correct: 0, diff: 'hard' },
    { q: 'Every even number greater than 2 is sum of two primes.', a: ['True \u2014 Goldbach conjecture','False','Sometimes','Only up to 100'], correct: 0, diff: 'hard' },
  ],
  logic_oddone: [
    { q: 'Odd one out: Cat, Dog, Rose, Fish', a: ['Cat','Dog','Rose','Fish'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Red, Blue, Apple, Green', a: ['Red','Blue','Apple','Green'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: 2, 4, 5, 8', a: ['2','4','5','8'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Car, Bus, Banana, Train', a: ['Car','Bus','Banana','Train'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Circle, Square, Triangle, Banana', a: ['Circle','Square','Triangle','Banana'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Cow, Horse, Sheep, Table', a: ['Cow','Horse','Sheep','Table'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Monday, Friday, March, Sunday', a: ['Monday','Friday','March','Sunday'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Hammer, Saw, Drill, Pillow', a: ['Hammer','Saw','Drill','Pillow'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Dog, Cat, Bird, Stone', a: ['Dog','Cat','Stone','Bird'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: 2, 4, 7, 8', a: ['2','4','7','8'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Mars, Venus, Sun, Jupiter', a: ['Mars','Venus','Sun','Jupiter'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Violin, Drum, Flute, Piano', a: ['Violin','Drum','Flute','Piano'], correct: 1, diff: 'medium' },
    { q: 'Odd one out: Eagle, Sparrow, Penguin, Robin', a: ['Eagle','Sparrow','Penguin','Robin'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: 9, 16, 25, 30', a: ['9','16','25','30'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Mercury, Earth, Pluto, Saturn', a: ['Mercury','Earth','Pluto','Saturn'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Cello, Viola, Harp, Saxophone', a: ['Cello','Viola','Harp','Saxophone'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Whisper, Shout, Mutter, Listen', a: ['Whisper','Shout','Mutter','Listen'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: 121, 144, 150, 169', a: ['121','144','150','169'], correct: 2, diff: 'hard' },
    { q: 'Odd one out: O, S, X, Z', a: ['O','S','X','Z'], correct: 0, diff: 'hard' },
    { q: 'Odd one out: Nitrogen, Helium, Oxygen, Carbon', a: ['Nitrogen','Helium','Oxygen','Carbon'], correct: 1, diff: 'hard' },
    { q: 'Odd one out: 27, 64, 100, 125', a: ['27','64','100','125'], correct: 2, diff: 'hard' },
    { q: 'Odd one out: Simile, Metaphor, Adjective, Hyperbole', a: ['Simile','Metaphor','Adjective','Hyperbole'], correct: 2, diff: 'hard' },
    { q: 'Odd one out: Hydrogen, Sodium, Potassium, Lithium', a: ['Hydrogen','Sodium','Potassium','Lithium'], correct: 0, diff: 'hard' },
    { q: 'Odd one out: Shakespeare, Dickens, Einstein, Austen', a: ['Shakespeare','Dickens','Einstein','Austen'], correct: 2, diff: 'hard' },
  ],
  logic_syllogism: [
    { q: 'All birds can fly. Eagle is a bird. Can it fly?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All dogs have tails. Rex is a dog. Does Rex have a tail?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All fruits are sweet. Lemon is a fruit. Is it sweet?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'No fish are mammals. Salmon is a fish. Is it a mammal?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'easy' },
    { q: 'All roses are flowers. Daisy is a flower. Is Daisy a rose?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'easy' },
    { q: 'All balls are round. A marble is a ball. Is it round?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'No reptiles have fur. A snake is a reptile. Does it have fur?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'easy' },
    { q: 'All cars have wheels. A bus has wheels. Is a bus a car?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'easy' },
    { q: 'All cats are animals. Whiskers is a cat. Is it an animal?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'No fish are mammals. Sharks are fish. Are sharks mammals?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'medium' },
    { q: 'Some apples are red. All red things are bright. Are some apples bright?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'All A are B. No B are C. Are any A also C?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'medium' },
    { q: 'All trees have roots. An oak is a tree. Does it have roots?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'Some birds swim. Penguins are birds. Can penguins swim?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'All squares are rectangles. All rectangles have 4 sides. Do squares have 4 sides?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'No insects are fish. All ants are insects. Are any ants fish?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'medium' },
    { q: 'Some A are B. All B are C. Must some A be C?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'No X are Y. Some Y are Z. Can X be Z?', a: ['Yes','No','Never','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'All P are Q. Some Q are R. Must some P be R?', a: ['Yes','No','Maybe','Always'], correct: 1, diff: 'hard' },
    { q: 'Some M are N. Some N are O. Must some M be O?', a: ['Yes','No','Sometimes','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'All A are B. All B are C. All C are D. Must all A be D?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'No heroes are cowards. Some soldiers are heroes. Are all soldiers brave?', a: ['Yes','No','Can\'t tell','Only heroes'], correct: 2, diff: 'hard' },
    { q: 'All mammals breathe air. Whales breathe air. Are whales mammals?', a: ['Yes','No','Can\'t tell from this','Maybe'], correct: 2, diff: 'hard' },
    { q: 'Some X are Y. All Y are Z. No Z are W. Can any X be W?', a: ['Yes','No','Some can','Can\'t tell'], correct: 3, diff: 'hard' },
  ],

  // ── COMP. THINKING ────────────────────────────────────────────────
  ct_binary: [
    { q: 'What is 1 in binary?', a: ['0','1','10','11'], correct: 1, diff: 'easy' },
    { q: 'What is binary 10 in decimal?', a: ['1','2','3','4'], correct: 1, diff: 'easy' },
    { q: 'What is binary 11 in decimal?', a: ['2','3','4','5'], correct: 1, diff: 'easy' },
    { q: 'What is 4 in binary?', a: ['10','11','100','101'], correct: 2, diff: 'easy' },
    { q: 'What is 3 in binary?', a: ['10','11','100','101'], correct: 1, diff: 'easy' },
    { q: 'What is binary 101 in decimal?', a: ['3','4','5','6'], correct: 2, diff: 'easy' },
    { q: 'How many digits does binary 4 need?', a: ['2','3','4','1'], correct: 1, diff: 'easy' },
    { q: 'What is 0 in binary?', a: ['0','1','00','10'], correct: 0, diff: 'easy' },
    { q: 'What is 1010 in decimal?', a: ['8','10','12','16'], correct: 1, diff: 'medium' },
    { q: 'What is 11 in binary?', a: ['1011','1100','1101','1010'], correct: 0, diff: 'medium' },
    { q: 'What is 0110 in decimal?', a: ['4','5','6','7'], correct: 2, diff: 'medium' },
    { q: 'What is 8 in binary?', a: ['1000','0111','1001','1010'], correct: 0, diff: 'medium' },
    { q: 'What is 7 in binary?', a: ['101','110','111','1000'], correct: 2, diff: 'medium' },
    { q: 'What is binary 1100 in decimal?', a: ['10','11','12','13'], correct: 2, diff: 'medium' },
    { q: 'What is 15 in binary?', a: ['1110','1111','10000','1101'], correct: 1, diff: 'medium' },
    { q: 'What is binary 10001 in decimal?', a: ['15','16','17','18'], correct: 2, diff: 'medium' },
    { q: 'What is 1111 in decimal?', a: ['13','14','15','16'], correct: 2, diff: 'hard' },
    { q: 'What is 25 in binary?', a: ['11001','10101','11000','10011'], correct: 0, diff: 'hard' },
    { q: 'What is 10110 in decimal?', a: ['20','21','22','23'], correct: 2, diff: 'hard' },
    { q: 'What is 1010 + 0101 in binary?', a: ['1111','10000','1110','1100'], correct: 0, diff: 'hard' },
    { q: 'What is 32 in binary?', a: ['11111','100000','100001','011111'], correct: 1, diff: 'hard' },
    { q: 'What is binary 11010 in decimal?', a: ['24','25','26','27'], correct: 2, diff: 'hard' },
    { q: 'What is 1011 + 1001 in binary?', a: ['10010','10100','10110','10000'], correct: 1, diff: 'hard' },
    { q: 'How many 1s are in the binary of 255?', a: ['6','7','8','9'], correct: 2, diff: 'hard' },
  ],
  ct_sequences: [
    { q: 'What prints? x=1; x=x+1; print x', a: ['1','2','3','x'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=5; print x', a: ['5','x','0','error'], correct: 0, diff: 'easy' },
    { q: 'What prints? x=3; x=x*2; print x', a: ['3','5','6','9'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=10; x=x-4; print x', a: ['4','6','10','14'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=0; x=x+5; print x', a: ['0','5','x','error'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=8; x=x/2; print x', a: ['2','4','8','16'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=3; y=4; print x+y', a: ['3','4','7','34'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=10; x=x-10; print x', a: ['0','10','-10','error'], correct: 0, diff: 'easy' },
    { q: 'Which step is FIRST in sorting?', a: ['Swap','Compare','Return','Count'], correct: 1, diff: 'medium' },
    { q: 'What is the output: x=5; x=x+3; print x?', a: ['5','3','8','53'], correct: 2, diff: 'medium' },
    { q: 'x=2; for 3 times: x=x*2; What is x?', a: ['6','8','12','16'], correct: 3, diff: 'medium' },
    { q: 'What does LIFO stand for?', a: ['Last In First Out','Last In Fast Out','Least In First Out','List In First Out'], correct: 0, diff: 'medium' },
    { q: 'What does FIFO stand for?', a: ['First In First Out','Fast In Fast Out','First In Final Out','Find In Find Out'], correct: 0, diff: 'medium' },
    { q: 'x=1; y=x; x=2; What is y?', a: ['1','2','x','error'], correct: 0, diff: 'medium' },
    { q: 'Array [5,10,15,20]. What is arr[0]?', a: ['5','10','15','0'], correct: 0, diff: 'medium' },
    { q: 'x="hi"; y="there"; print x+y', a: ['hithere','hi there','error','hiythere'], correct: 0, diff: 'medium' },
    { q: 'Array [3,1,4,1,5]. What is index 2?', a: ['1','4','3','5'], correct: 1, diff: 'hard' },
    { q: 'x=[1,2,3]; x.pop(); What is x?', a: ['[1,2]','[2,3]','[1,2,3]','[1,3]'], correct: 0, diff: 'hard' },
    { q: 'What is O(n\u00b2) called?', a: ['Linear','Quadratic','Logarithmic','Constant'], correct: 1, diff: 'hard' },
    { q: 'Stack: push(1), push(2), pop(). Top is?', a: ['1','2','empty','error'], correct: 0, diff: 'hard' },
    { q: 'x=[4,3,2,1]; x.sort(); What is x[0]?', a: ['4','3','1','2'], correct: 2, diff: 'hard' },
    { q: 'Queue: enqueue(A), enqueue(B), dequeue(). What comes out?', a: ['A','B','empty','error'], correct: 0, diff: 'hard' },
    { q: 'x=10; y=x%3; What is y?', a: ['0','1','3','10'], correct: 1, diff: 'hard' },
    { q: 'What does len("hello") return?', a: ['4','5','6','error'], correct: 1, diff: 'hard' },
  ],
  ct_loops: [
    { q: 'What does a loop do?', a: ['Stores data','Repeats code','Makes decisions','Ends program'], correct: 1, diff: 'easy' },
    { q: 'How many times: repeat 4 times: clap', a: ['3','4','5','1'], correct: 1, diff: 'easy' },
    { q: 'What is the opposite of a loop?', a: ['Sequence','Branch','Function','Single run'], correct: 3, diff: 'easy' },
    { q: 'A loop that never stops is called?', a: ['Fast loop','Infinite loop','Dead loop','Mega loop'], correct: 1, diff: 'easy' },
    { q: 'repeat 3 times: say "hi". How many "hi"s?', a: ['1','2','3','4'], correct: 2, diff: 'easy' },
    { q: 'What keyword is used to repeat code?', a: ['if','loop','print','return'], correct: 1, diff: 'easy' },
    { q: 'A "while" loop checks a ___ before repeating.', a: ['Variable','Condition','Function','Number'], correct: 1, diff: 'easy' },
    { q: 'How many times: repeat 1 time: jump', a: ['0','1','2','3'], correct: 1, diff: 'easy' },
    { q: 'If/Then is used for...?', a: ['Loops','Conditions','Variables','Functions'], correct: 1, diff: 'medium' },
    { q: 'for i in range(3) \u2014 how many loops?', a: ['2','3','4','1'], correct: 1, diff: 'medium' },
    { q: 'What does "break" do in a loop?', a: ['Restarts it','Pauses it','Exits it','Speeds it'], correct: 2, diff: 'medium' },
    { q: 'sum=0; for i in [1,2,3]: sum+=i; sum=?', a: ['3','5','6','7'], correct: 2, diff: 'medium' },
    { q: 'x=10; while x>5: x-=2; What is final x?', a: ['4','5','6','0'], correct: 0, diff: 'medium' },
    { q: '"continue" in a loop does what?', a: ['Stops the loop','Skips to next iteration','Restarts program','Pauses loop'], correct: 1, diff: 'medium' },
    { q: 'for i in range(1,5): count. How many loops?', a: ['3','4','5','6'], correct: 1, diff: 'medium' },
    { q: 'x=1; for i in range(4): x=x*2; What is x?', a: ['8','16','32','4'], correct: 1, diff: 'medium' },
    { q: 'while x>0: x-=1. If x starts at 3, how many loops?', a: ['2','3','4','0'], correct: 1, diff: 'hard' },
    { q: 'Nested loop 3x3: total iterations?', a: ['3','6','9','12'], correct: 2, diff: 'hard' },
    { q: 'for i in range(10): if i%2==0: count+=1; count=?', a: ['4','5','6','10'], correct: 1, diff: 'hard' },
    { q: 'while True: if x>10: break; x+=3; x starts at 1. Final x?', a: ['10','11','13','12'], correct: 2, diff: 'hard' },
    { q: 'for i in range(5): for j in range(2): count. Total?', a: ['5','7','10','12'], correct: 2, diff: 'hard' },
    { q: 'x=100; while x>1: x=x//2; How many loops?', a: ['5','6','7','8'], correct: 2, diff: 'hard' },
    { q: 'for i in range(20): if i%3==0 and i%5==0: count+=1; count=?', a: ['1','2','3','4'], correct: 0, diff: 'hard' },
    { q: 'x=2; while x<100: x=x*x; What is final x?', a: ['16','64','256','128'], correct: 2, diff: 'hard' },
  ],
  ct_debug: [
    { q: "print('Hello Wrold') \u2014 what is the bug?", a: ["Typo in 'Wrold'","Missing semicolon","Wrong quotes","No bug"], correct: 0, diff: 'easy' },
    { q: 'x = 5 + ; \u2014 what is the bug?', a: ['Missing number after +','Missing semicolon','Wrong variable','No bug'], correct: 0, diff: 'easy' },
    { q: 'primt("hi") \u2014 what is the bug?', a: ['Typo: primt','Wrong quotes','Missing (','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = "5" + 3 \u2014 potential bug?', a: ['Type mismatch','Syntax error','No bug','Missing quote'], correct: 0, diff: 'easy' },
    { q: 'print("Hello) \u2014 what is the bug?', a: ['Missing closing quote','Missing semicolon','Wrong function','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = 10 / 0 \u2014 what is the bug?', a: ['Division by zero','Missing variable','Syntax error','No bug'], correct: 0, diff: 'easy' },
    { q: 'prnt("test") \u2014 what is the bug?', a: ['Typo: prnt','Missing quotes','Wrong brackets','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = 5 +* 3 \u2014 what is the bug?', a: ['Two operators together','Missing variable','Wrong number','No bug'], correct: 0, diff: 'easy' },
    { q: 'for i in range(3): print(i) \u2014 what prints first?', a: ['1','0','3','2'], correct: 1, diff: 'medium' },
    { q: 'x = 5; if x = 5: print("yes") \u2014 the bug is?', a: ['No bug','= should be ==','Missing colon','Wrong indent'], correct: 1, diff: 'medium' },
    { q: 'for i in range(3): print(i) \u2014 what prints last?', a: ['3','2','1','0'], correct: 1, diff: 'medium' },
    { q: 'x = []; x[0] = 1 \u2014 the bug is?', a: ['Index out of range','No bug','Wrong bracket','Missing comma'], correct: 0, diff: 'medium' },
    { q: 'x = [1,2,3]; print(x[len(x)]) \u2014 the bug is?', a: ['Index out of range','No bug','Wrong function','Missing comma'], correct: 0, diff: 'medium' },
    { q: 'if x > 5 print("big") \u2014 the bug is?', a: ['Missing colon after condition','No bug','Wrong operator','Missing quotes'], correct: 0, diff: 'medium' },
    { q: 'x = "10"; y = x + 5 \u2014 the bug is?', a: ['Type mismatch \u2014 string + int','No bug','Missing quotes','Wrong variable'], correct: 0, diff: 'medium' },
    { q: 'def greet(name) print("Hi " + name) \u2014 the bug is?', a: ['Missing colon after def','No bug','Wrong quotes','Missing return'], correct: 0, diff: 'medium' },
    { q: 'list=[1,2,3]; print(list[3]) \u2014 the bug is?', a: ['No bug','Index out of range','Wrong syntax','Missing bracket'], correct: 1, diff: 'hard' },
    { q: 'def f(x): return x+1; f() \u2014 the bug is?', a: ['Missing argument','No bug','Wrong return','Missing def'], correct: 0, diff: 'hard' },
    { q: 'x=0; while x<5: print(x) \u2014 the bug is?', a: ['Infinite loop \u2014 x never changes','No bug','Wrong condition','Missing print'], correct: 0, diff: 'hard' },
    { q: 'if x = 10 and y == 5: \u2014 the bug is?', a: ['= should be ==','Missing colon','No bug','Wrong operator'], correct: 0, diff: 'hard' },
    { q: 'x = [1,2,3]; x.remove(4) \u2014 the bug is?', a: ['4 is not in the list','No bug','Wrong syntax','Missing index'], correct: 0, diff: 'hard' },
    { q: 'def add(a,b): return a + b; result = add(1) \u2014 the bug is?', a: ['Missing second argument','No bug','Wrong return type','Missing colon'], correct: 0, diff: 'hard' },
    { q: 'for i in range(5): total += i \u2014 the bug is?', a: ['total not initialized','No bug','Wrong range','Missing print'], correct: 0, diff: 'hard' },
    { q: 'nums=[3,1,2]; nums.sort(); print(nums[-4]) \u2014 the bug is?', a: ['Index -4 out of range','No bug','Sort is wrong','Missing bracket'], correct: 0, diff: 'hard' },
  ],

  // ── WORD ──────────────────────────────────────────────────────────
  word_anagram: [
    { q: 'Anagram of CAT?', a: ['ACT','TAC','ATC','CTA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of TOP?', a: ['POT','OPT','TPO','OTP'], correct: 0, diff: 'easy' },
    { q: 'Anagram of TAR?', a: ['RAT','ART','TRA','RTA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of DOG?', a: ['GOD','OGD','DGO','GDO'], correct: 0, diff: 'easy' },
    { q: 'Anagram of PAN?', a: ['NAP','ANP','PNA','NPA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of EAT?', a: ['TEA','ATE','ETA','All of these'], correct: 3, diff: 'easy' },
    { q: 'Anagram of OWL?', a: ['LOW','WOL','OLW','LWO'], correct: 0, diff: 'easy' },
    { q: 'Anagram of MAT?', a: ['TAM','ATM','MTA','TMA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of SILENT?', a: ['TINSEL','LISTEN','ENLIST','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of PLATES?', a: ['PETALS','STAPLE','PASTEL','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of DANGER?', a: ['GARDEN','GANDER','RANGED','All of these'], correct: 0, diff: 'medium' },
    { q: 'Anagram of LISTEN?', a: ['SILENT','ENLIST','TINSEL','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of RACE?', a: ['CARE','ACRE','ARCE','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of HEART?', a: ['EARTH','HATER','RATHE','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of SPARE?', a: ['PEARS','SPEAR','PARSE','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of NOTES?', a: ['STONE','ONSET','TONES','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of EARTH?', a: ['HEART','HATER','RATHE','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of ORCHESTRA?', a: ['CARTHORSE','CHORTERAS','ORCATHRES','HORSERACE'], correct: 0, diff: 'hard' },
    { q: 'Anagram of ASTRONOMER?', a: ['MOON STARER','STAR MOONER','ROAM STONES','SONAR MOTEL'], correct: 0, diff: 'hard' },
    { q: 'Anagram of DORMITORY?', a: ['DIRTY ROOM','MOOR DIRTY','DORM RIOT','DROOMITY'], correct: 0, diff: 'hard' },
    { q: 'Anagram of INTEGRAL?', a: ['TRIANGLE','RELATING','ALERTING','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of DICTIONARY?', a: ['INDICATORY','DIRTY COIN','IONARY DIC','CORD IN AIT'], correct: 0, diff: 'hard' },
    { q: 'Anagram of ELEVEN PLUS TWO?', a: ['TWELVE PLUS ONE','ELVES OWN PLUT','TOWELEVEN SLP','WTOLE PLUS NEV'], correct: 0, diff: 'hard' },
    { q: 'Anagram of LISTEN?', a: ['INLETS','ENLIST','SILENT','All of these'], correct: 3, diff: 'hard' },
  ],
  word_analogy: [
    { q: 'Hot : Cold :: Big : ?', a: ['Large','Small','Warm','Huge'], correct: 1, diff: 'easy' },
    { q: 'Up : Down :: Left : ?', a: ['Up','Right','Side','North'], correct: 1, diff: 'easy' },
    { q: 'Dog : Puppy :: Cat : ?', a: ['Kitten','Cub','Pup','Kit'], correct: 0, diff: 'easy' },
    { q: 'Day : Night :: Light : ?', a: ['Bright','Dark','Dim','Shadow'], correct: 1, diff: 'easy' },
    { q: 'Bird : Nest :: Bear : ?', a: ['Den','Cave','Forest','Tree'], correct: 0, diff: 'easy' },
    { q: 'Foot : Shoe :: Hand : ?', a: ['Glove','Ring','Finger','Sock'], correct: 0, diff: 'easy' },
    { q: 'Ear : Hear :: Eye : ?', a: ['Blink','See','Cry','Wink'], correct: 1, diff: 'easy' },
    { q: 'Milk : White :: Sky : ?', a: ['Cloud','Blue','High','Rain'], correct: 1, diff: 'easy' },
    { q: 'Hot : Cold :: Fast : ?', a: ['Quick','Slow','Run','Speed'], correct: 1, diff: 'medium' },
    { q: 'Sun is to Day as Moon is to ?', a: ['Star','Sky','Night','Light'], correct: 2, diff: 'medium' },
    { q: 'Author : Book :: Painter : ?', a: ['Brush','Canvas','Gallery','Painting'], correct: 3, diff: 'medium' },
    { q: 'Fish : School :: Wolf : ?', a: ['Den','Pack','Herd','Flock'], correct: 1, diff: 'medium' },
    { q: 'Page : Book :: Brick : ?', a: ['Clay','Red','Wall','Heavy'], correct: 2, diff: 'medium' },
    { q: 'Pen : Writer :: Brush : ?', a: ['Canvas','Painter','Color','Art'], correct: 1, diff: 'medium' },
    { q: 'Calf : Cow :: Foal : ?', a: ['Pig','Horse','Sheep','Goat'], correct: 1, diff: 'medium' },
    { q: 'Chapter : Book :: Scene : ?', a: ['Movie','Play','Actor','Stage'], correct: 1, diff: 'medium' },
    { q: 'Big : Small :: Wide : ?', a: ['Large','Tall','Narrow','Short'], correct: 2, diff: 'hard' },
    { q: 'Library : Books :: Museum : ?', a: ['Art','History','Artifacts','Tickets'], correct: 2, diff: 'hard' },
    { q: 'Thermometer : Temperature :: Clock : ?', a: ['Numbers','Hands','Time','Alarm'], correct: 2, diff: 'hard' },
    { q: 'Archipelago : Islands :: Constellation : ?', a: ['Planets','Stars','Galaxies','Moons'], correct: 1, diff: 'hard' },
    { q: 'Oasis : Desert :: Island : ?', a: ['Beach','Sand','Ocean','Palm'], correct: 2, diff: 'hard' },
    { q: 'Prologue : Epilogue :: Dawn : ?', a: ['Morning','Day','Dusk','Night'], correct: 2, diff: 'hard' },
    { q: 'Conductor : Orchestra :: Director : ?', a: ['Movie','Stage','Film','Cast'], correct: 3, diff: 'hard' },
    { q: 'Stanza : Poem :: Paragraph : ?', a: ['Sentence','Essay','Word','Book'], correct: 1, diff: 'hard' },
  ],
  word_palindrome: [
    { q: 'Is "MOM" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "DAD" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "DOG" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "POP" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "NUN" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "CAR" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "WOW" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "SUN" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Which word is a palindrome?', a: ['Level','Apple','Table','Bread'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome? RADAR, TIGER, CHAIR, STONE', a: ['RADAR','TIGER','CHAIR','STONE'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['MADAM','HELLO','WORLD','TABLE'], correct: 0, diff: 'medium' },
    { q: 'Which number is a palindrome?', a: ['12321','12345','13579','24680'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['REFER','NEVER','RIVER','SUPER'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['PAPER','ROTOR','MOTOR','TOWER'], correct: 1, diff: 'medium' },
    { q: 'Which number is a palindrome?', a: ['45654','45678','12346','98760'], correct: 0, diff: 'medium' },
    { q: 'Is "DEED" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Is "A man a plan a canal Panama" a palindrome?', a: ['Yes','No','Only forwards','Only backwards'], correct: 0, diff: 'hard' },
    { q: 'Which is NOT a palindrome?', a: ['RACECAR','KAYAK','PYTHON','CIVIC'], correct: 2, diff: 'hard' },
    { q: 'Is "Was it a car or a cat I saw" a palindrome?', a: ['Yes','No','Only some letters','Depends'], correct: 0, diff: 'hard' },
    { q: 'The longest common palindrome word is?', a: ['RACECAR','ROTATOR','DEIFIED','REDIVIDER'], correct: 3, diff: 'hard' },
    { q: 'Which is NOT a palindrome?', a: ['LEVEL','ROTOR','RADAR','LEMON'], correct: 3, diff: 'hard' },
    { q: 'Is "Never odd or even" a palindrome (ignoring spaces)?', a: ['Yes','No','Only partially','Depends'], correct: 0, diff: 'hard' },
    { q: 'Which is the longest palindrome?', a: ['NOON','LEVEL','RACECAR','ROTATOR'], correct: 3, diff: 'hard' },
    { q: 'Is "Do geese see God" a palindrome (ignoring spaces)?', a: ['Yes','No','Only forwards','Depends'], correct: 0, diff: 'hard' },
  ],
  word_oddone: [
    { q: 'Odd one out: Red, Blue, Circle, Green', a: ['Red','Blue','Circle','Green'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Apple, Banana, Chair, Mango', a: ['Apple','Banana','Chair','Mango'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: Run, Walk, Jump, Book', a: ['Run','Walk','Jump','Book'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Pencil, Pen, Crayon, Pizza', a: ['Pencil','Pen','Crayon','Pizza'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Table, Chair, Sofa, Elephant', a: ['Table','Chair','Sofa','Elephant'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Shirt, Pants, Hat, Hammer', a: ['Shirt','Pants','Hat','Hammer'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Car, Bike, Plane, Cookie', a: ['Car','Bike','Plane','Cookie'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Soccer, Tennis, Cricket, Painting', a: ['Soccer','Tennis','Cricket','Painting'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Apple, Banana, Carrot, Mango', a: ['Apple','Banana','Carrot','Mango'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Piano, Guitar, Trumpet, Table', a: ['Piano','Guitar','Trumpet','Table'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Paris, London, Italy, Tokyo', a: ['Paris','London','Italy','Tokyo'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Happy, Sad, Angry, Quickly', a: ['Happy','Sad','Angry','Quickly'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Whale, Dolphin, Shark, Elephant', a: ['Whale','Dolphin','Shark','Elephant'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Rose, Tulip, Oak, Daisy', a: ['Rose','Tulip','Oak','Daisy'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Kilometer, Meter, Liter, Centimeter', a: ['Kilometer','Meter','Liter','Centimeter'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Bread, Rice, Pasta, Milk', a: ['Bread','Rice','Pasta','Milk'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Whisper, Shout, Mutter, Listen', a: ['Whisper','Shout','Mutter','Listen'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Sonnet, Haiku, Novel, Limerick', a: ['Sonnet','Haiku','Novel','Limerick'], correct: 2, diff: 'hard' },
    { q: 'Odd one out: Simile, Metaphor, Alliteration, Paragraph', a: ['Simile','Metaphor','Alliteration','Paragraph'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Oxygen, Nitrogen, Helium, Diamond', a: ['Oxygen','Nitrogen','Helium','Diamond'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Verb, Noun, Adjective, Sentence', a: ['Verb','Noun','Adjective','Sentence'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Mercury, Venus, Mars, Moon', a: ['Mercury','Venus','Mars','Moon'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Soprano, Alto, Baritone, Crescendo', a: ['Soprano','Alto','Baritone','Crescendo'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Democracy, Monarchy, Aristocracy, Bureaucracy', a: ['Democracy','Monarchy','Aristocracy','Bureaucracy'], correct: 3, diff: 'hard' },
  ],

  // ── MEMORY ────────────────────────────────────────────────────────
  // memory_numbers: [
    // { q: 'Remember: 3-7. What was FIRST?', a: ['3','7','4','1'], correct: 0, diff: 'easy', memory: true },
    // { q: 'Remember: 5-2. What was SECOND?', a: ['5','2','3','7'], correct: 1, diff: 'easy', memory: true },
    // { q: 'Remember: 8-1. What was FIRST?', a: ['1','8','3','6'], correct: 1, diff: 'easy', memory: true },
    // { q: 'Remember: 4-9. What was SECOND?', a: ['4','9','7','2'], correct: 1, diff: 'easy', memory: true },
    // { q: 'Remember: 7-3-9-1. What was THIRD?', a: ['3','7','9','1'], correct: 2, diff: 'medium', memory: true },
    // { q: 'Remember: 2-5-8-4. What was SECOND?', a: ['2','5','8','4'], correct: 1, diff: 'medium', memory: true },
    // { q: 'Remember: 6-1-4-9. What was FOURTH?', a: ['6','1','4','9'], correct: 3, diff: 'medium', memory: true },
    // { q: 'Remember: 3-7-2-5. What was FIRST?', a: ['3','7','2','5'], correct: 0, diff: 'medium', memory: true },
    // { q: 'Remember: 4-8-2-6-5. What was FOURTH?', a: ['2','6','8','5'], correct: 1, diff: 'hard', memory: true },
    // { q: 'Remember: 9-1-3-7-2. What was THIRD?', a: ['9','1','3','7'], correct: 2, diff: 'hard', memory: true },
    // { q: 'Remember: 5-3-8-1-6. What was FIFTH?', a: ['5','8','1','6'], correct: 3, diff: 'hard', memory: true },
    // { q: 'Remember: 2-7-4-9-3. What was SECOND?', a: ['2','7','4','9'], correct: 1, diff: 'hard', memory: true },
  // ],
  // memory_words: [
    // { q: 'Remember: RED-BLUE. What was FIRST?', a: ['Red','Blue','Green','Yellow'], correct: 0, diff: 'easy', memory: true },
    // { q: 'Remember: CAT-DOG. What was SECOND?', a: ['Cat','Dog','Bird','Fish'], correct: 1, diff: 'easy', memory: true },
    // { q: 'Remember: SUN-MOON. What was FIRST?', a: ['Sun','Moon','Star','Sky'], correct: 0, diff: 'easy', memory: true },
    // { q: 'Remember: TREE-ROCK. What was SECOND?', a: ['Tree','Rock','Lake','Sand'], correct: 1, diff: 'easy', memory: true },
    // { q: 'Remember: RED-BLUE-GREEN. What was SECOND?', a: ['Red','Blue','Green','Yellow'], correct: 1, diff: 'medium', memory: true },
    // { q: 'Remember: APPLE-MOON-STAR. What was THIRD?', a: ['Apple','Moon','Star','River'], correct: 2, diff: 'medium', memory: true },
    // { q: 'Remember: FISH-BIRD-TREE. What was FIRST?', a: ['Fish','Bird','Tree','Rock'], correct: 0, diff: 'medium', memory: true },
    // { q: 'Remember: RAIN-SNOW-WIND. What was SECOND?', a: ['Rain','Snow','Wind','Hail'], correct: 1, diff: 'medium', memory: true },
    // { q: 'Remember: APPLE-MOON-RIVER-CLOCK. What was THIRD?', a: ['Apple','Moon','River','Clock'], correct: 2, diff: 'hard', memory: true },
    // { q: 'Remember: NORTH-EAST-SOUTH-WEST. What was SECOND?', a: ['North','East','South','West'], correct: 1, diff: 'hard', memory: true },
    // { q: 'Remember: IRON-GOLD-SILVER-BRONZE. What was FOURTH?', a: ['Iron','Gold','Silver','Bronze'], correct: 3, diff: 'hard', memory: true },
    // { q: 'Remember: SPRING-SUMMER-FALL-WINTER. What was THIRD?', a: ['Spring','Summer','Fall','Winter'], correct: 2, diff: 'hard', memory: true },
  // ],
  // memory_previous: [
    // { q: 'What was the FIRST question\'s category?', a: ['Math','Logic','Memory','Word'], correct: 0, memory: true, diff: 'easy' },
    // { q: 'How many rounds have passed so far?', a: ['1','2','3','4'], correct: 1, memory: true, diff: 'medium' },
    // { q: 'Was the last answer A, B, C, or D?', a: ['A','B','C','D'], correct: 2, memory: true, diff: 'medium' },
    // { q: 'How many questions have been asked so far?', a: ['1','2','3','4'], correct: 1, memory: true, diff: 'hard' },
  // ],
};

export const SUB_DEFS: Record<string, { icon: string; label: string; color: string; subs: [string, string][] }> = {
  math: {
    icon: '\uD83D\uDD22',
    label: 'Math',
    color: 'math',
    subs: [
      ['math_arithmetic', 'Arithmetic'],
      ['math_fractions', 'Fractions'],
      ['math_percent', 'Percentages'],
      ['math_missing', 'Missing Numbers'],
    ],
  },
  logic: {
    icon: '\uD83E\uDDE9',
    label: 'Logic',
    color: 'logic',
    subs: [
      ['logic_patterns', 'Patterns'],
      ['logic_truefalse', 'True / False'],
      ['logic_oddone', 'Odd One Out'],
      ['logic_syllogism', 'Logic Puzzles'],
    ],
  },
  ct: {
    icon: '\uD83D\uDCBB',
    label: 'Comp. Thinking',
    color: 'ct',
    subs: [
      ['ct_binary', 'Binary'],
      ['ct_sequences', 'Sequences'],
      ['ct_loops', 'Loops & Conditions'],
      ['ct_debug', 'Debugging'],
    ],
  },
  word: {
    icon: '\uD83D\uDD24',
    label: 'Word',
    color: 'word',
    subs: [
      ['word_anagram', 'Anagrams'],
      ['word_analogy', 'Analogies'],
      ['word_palindrome', 'Palindromes'],
      ['word_oddone', 'Odd One Out'],
    ],
  },
  memory: {
    icon: '\uD83E\uDDE0',
    label: 'Memory',
    color: 'memory',
    subs: [
      ['memory_numbers', 'Number Sequences'],
      ['memory_words', 'Word Recall'],
      ['memory_previous', 'Previous Answers'],
    ],
  },
};

// ===== Dynamic Question Generators =====

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleAnswers(correct: string, wrongs: string[]): { a: string[]; correct: number } {
  const answers = [correct, ...wrongs.slice(0, 3)];
  // Fisher-Yates shuffle
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  return { a: answers, correct: answers.indexOf(correct) };
}

function makeWrongAnswers(correct: number, count = 3): string[] {
  const wrongs = new Set<string>();
  // Near misses
  wrongs.add(String(correct + 1));
  wrongs.add(String(correct - 1));
  wrongs.add(String(correct + 2));
  wrongs.add(String(correct - 2));
  wrongs.add(String(correct + randInt(3, 8)));
  wrongs.add(String(correct - randInt(3, 8)));
  // Remove the correct answer if it snuck in
  wrongs.delete(String(correct));
  const arr = Array.from(wrongs);
  // Shuffle and pick
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function generateArithmetic(diff: Difficulty): Question {
  let q = '';
  let answer = 0;

  if (diff === 'easy') {
    const op = pickOne(['+', '-', '×']);
    if (op === '+') {
      const a = randInt(1, 20), b = randInt(1, 20);
      q = `What is ${a} + ${b}?`; answer = a + b;
    } else if (op === '-') {
      const a = randInt(10, 30), b = randInt(1, a);
      q = `What is ${a} - ${b}?`; answer = a - b;
    } else {
      const a = randInt(2, 9), b = randInt(2, 9);
      q = `What is ${a} × ${b}?`; answer = a * b;
    }
  } else if (diff === 'medium') {
    const op = pickOne(['×', '÷', '+', '-']);
    if (op === '×') {
      const a = randInt(10, 25), b = randInt(2, 12);
      q = `What is ${a} × ${b}?`; answer = a * b;
    } else if (op === '÷') {
      const b = randInt(2, 12), ans = randInt(3, 20);
      const a = b * ans;
      q = `What is ${a} ÷ ${b}?`; answer = ans;
    } else if (op === '+') {
      const a = randInt(50, 200), b = randInt(30, 150);
      q = `What is ${a} + ${b}?`; answer = a + b;
    } else {
      const a = randInt(100, 300), b = randInt(30, a);
      q = `What is ${a} - ${b}?`; answer = a - b;
    }
  } else {
    const type = pickOne(['square', 'sqrt', 'mult', 'power']);
    if (type === 'square') {
      const a = randInt(5, 15), b = randInt(3, 10);
      q = `What is ${a}² + ${b}²?`; answer = a * a + b * b;
    } else if (type === 'sqrt') {
      const root = randInt(4, 20);
      q = `What is √${root * root}?`; answer = root;
    } else if (type === 'mult') {
      const a = randInt(10, 30), b = randInt(10, 30);
      q = `What is ${a} × ${b}?`; answer = a * b;
    } else {
      const base = randInt(2, 5), exp = randInt(3, 5);
      q = `What is ${base}${exp === 3 ? '³' : exp === 4 ? '⁴' : '⁵'}?`;
      answer = Math.pow(base, exp);
    }
  }

  const { a, correct } = shuffleAnswers(String(answer), makeWrongAnswers(answer));
  return { q, a, correct, diff };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatFrac(num: number, den: number): string {
  if (den === 1) return String(num);
  const g = gcd(Math.abs(num), Math.abs(den));
  return `${num / g}/${den / g}`;
}

function generateFraction(diff: Difficulty): Question {
  let q = '';
  let correctStr = '';

  if (diff === 'easy') {
    const type = pickOne(['add', 'of']);
    if (type === 'add') {
      const d = pickOne([2, 3, 4]);
      const a = randInt(1, d - 1), b = randInt(1, d - 1);
      const num = a + b;
      q = `What is ${a}/${d} + ${b}/${d}?`;
      correctStr = formatFrac(num, d);
    } else {
      const frac = pickOne([[1, 2], [1, 3], [1, 4], [3, 4], [2, 3]]);
      const whole = pickOne([6, 8, 9, 10, 12, 15, 16, 20]);
      const ans = (whole * frac[0]) / frac[1];
      if (Number.isInteger(ans)) {
        q = `What is ${frac[0]}/${frac[1]} of ${whole}?`;
        correctStr = String(ans);
      } else {
        q = `What is 1/2 of ${whole * 2}?`;
        correctStr = String(whole);
      }
    }
  } else if (diff === 'medium') {
    const op = pickOne(['+', '×']);
    const d1 = pickOne([2, 3, 4, 5, 6, 8]), d2 = pickOne([2, 3, 4, 5, 6, 8]);
    const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
    if (op === '+') {
      const num = n1 * d2 + n2 * d1;
      const den = d1 * d2;
      q = `What is ${n1}/${d1} + ${n2}/${d2}?`;
      correctStr = formatFrac(num, den);
    } else {
      const num = n1 * n2;
      const den = d1 * d2;
      q = `What is ${n1}/${d1} × ${n2}/${d2}?`;
      correctStr = formatFrac(num, den);
    }
  } else {
    const type = pickOne(['div', 'simplify']);
    if (type === 'div') {
      const d1 = pickOne([2, 3, 4, 5, 6]), d2 = pickOne([2, 3, 4, 5]);
      const n1 = randInt(1, d1 - 1 || 1), n2 = randInt(1, d2 - 1 || 1);
      const num = n1 * d2;
      const den = d1 * n2;
      q = `What is ${n1}/${d1} ÷ ${n2}/${d2}?`;
      correctStr = formatFrac(num, den);
    } else {
      const g = randInt(2, 6);
      const simpNum = randInt(1, 5), simpDen = randInt(simpNum + 1, 8);
      q = `Simplify ${simpNum * g}/${simpDen * g}:`;
      correctStr = formatFrac(simpNum, simpDen);
    }
  }

  // Generate wrong fraction answers
  const wrongs: string[] = [];
  const parts = correctStr.split('/');
  if (parts.length === 2) {
    const n = parseInt(parts[0]), d = parseInt(parts[1]);
    wrongs.push(formatFrac(n + 1, d), formatFrac(n, d + 1), formatFrac(n + 1, d + 1));
  } else {
    const val = parseInt(correctStr);
    wrongs.push(String(val + 1), String(val - 1), String(val + 2));
  }

  const { a, correct } = shuffleAnswers(correctStr, wrongs);
  return { q, a, correct, diff };
}

function generatePercent(diff: Difficulty): Question {
  let q = '';
  let answer = 0;

  if (diff === 'easy') {
    const pct = pickOne([10, 20, 25, 50, 75, 100]);
    const val = pickOne([10, 20, 30, 40, 50, 60, 80, 100]);
    answer = (pct * val) / 100;
    q = `What is ${pct}% of ${val}?`;
  } else if (diff === 'medium') {
    const pct = pickOne([5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 80, 90]);
    const val = pickOne([20, 40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500]);
    answer = (pct * val) / 100;
    q = `What is ${pct}% of ${val}?`;
  } else {
    const type = pickOne(['discount', 'increase', 'whatpct']);
    if (type === 'discount') {
      const pct = pickOne([10, 15, 20, 25, 30, 40, 50]);
      const price = pickOne([40, 50, 60, 80, 100, 120, 150, 200]);
      answer = price - (pct * price) / 100;
      q = `A $${price} item is ${pct}% off. Final price?`;
    } else if (type === 'increase') {
      const old = pickOne([20, 25, 30, 40, 50, 60, 80, 100]);
      const inc = pickOne([10, 20, 25, 50]);
      const newVal = old + (inc * old) / 100;
      answer = inc;
      q = `Price went from ${old} to ${newVal}. % increase?`;
    } else {
      const part = pickOne([10, 12, 15, 20, 25, 30, 40, 50, 60]);
      const whole = pickOne([40, 50, 60, 80, 100, 120, 150, 200, 250, 300]);
      if (part <= whole) {
        answer = Math.round((part / whole) * 100);
        q = `${part} is what percent of ${whole}?`;
      } else {
        answer = 25;
        q = `25 is what percent of 100?`;
      }
    }
  }

  const wrongStrs = makeWrongAnswers(answer);
  const correctStr = type_is_pct(q) ? `${answer}%` : `$${answer}`;
  const wrongFormatted = wrongStrs.map((w) => type_is_pct(q) ? `${w}%` : `$${w}`);

  // Use plain numbers for simple percentage-of questions
  const isPlain = q.startsWith('What is') && !q.includes('$');
  const { a, correct } = shuffleAnswers(
    isPlain ? String(answer) : correctStr,
    isPlain ? wrongStrs : wrongFormatted,
  );
  return { q, a, correct, diff };
}

function type_is_pct(q: string): boolean {
  return q.includes('% increase') || q.includes('what percent');
}

function generateMissing(diff: Difficulty): Question {
  let q = '';
  let answer = 0;

  if (diff === 'easy') {
    const type = pickOne(['+', '-', '×', '÷']);
    if (type === '+') {
      const ans = randInt(2, 15), b = randInt(1, 15);
      q = `_ + ${b} = ${ans + b}`;
      answer = ans;
    } else if (type === '-') {
      const ans = randInt(5, 20), b = randInt(1, ans - 1);
      q = `_ - ${b} = ${ans - b}`;
      answer = ans;
    } else if (type === '×') {
      const ans = randInt(2, 9), b = randInt(2, 9);
      q = `_ × ${b} = ${ans * b}`;
      answer = ans;
    } else {
      const ans = randInt(2, 10), b = randInt(2, 5);
      q = `${ans * b} ÷ _ = ${ans}`;
      answer = b;
    }
  } else if (diff === 'medium') {
    const type = pickOne(['×', '+', '÷']);
    if (type === '×') {
      const ans = randInt(3, 15), b = randInt(3, 12);
      q = `_ × ${b} = ${ans * b}`;
      answer = ans;
    } else if (type === '+') {
      const ans = randInt(15, 50), b = randInt(10, 40);
      q = `_ + ${b} = ${ans + b}`;
      answer = ans;
    } else {
      const ans = randInt(3, 15), b = randInt(2, 8);
      q = `${ans * b} ÷ _ = ${ans}`;
      answer = b;
    }
  } else {
    const type = pickOne(['square', 'linear', 'cube']);
    if (type === 'square') {
      const ans = randInt(4, 15);
      q = `_² = ${ans * ans}`;
      answer = ans;
    } else if (type === 'cube') {
      const ans = randInt(2, 6);
      q = `_³ = ${ans * ans * ans}`;
      answer = ans;
    } else {
      const ans = randInt(5, 20), mult = randInt(2, 5), add = randInt(3, 15);
      q = `${mult}_ + ${add} = ${mult * ans + add} (${mult}_ means ${mult}×_)`;
      answer = ans;
    }
  }

  const { a, correct } = shuffleAnswers(String(answer), makeWrongAnswers(answer));
  return { q, a, correct, diff };
}

function generatePattern(diff: Difficulty): Question {
  let seq: number[] = [];
  let answer = 0;

  if (diff === 'easy') {
    const start = randInt(1, 10), step = randInt(2, 10);
    seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  } else if (diff === 'medium') {
    const type = pickOne(['geometric', 'fibonacci', 'squares']);
    if (type === 'geometric') {
      const start = randInt(1, 4), ratio = pickOne([2, 3]);
      seq = Array.from({ length: 4 }, (_, i) => start * Math.pow(ratio, i));
      answer = start * Math.pow(ratio, 4);
    } else if (type === 'fibonacci') {
      const a = randInt(1, 5), b = randInt(1, 5);
      seq = [a, b];
      for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]);
      answer = seq.pop()!;
      // seq now has 4 elements
    } else {
      seq = [1, 4, 9, 16];
      answer = 25;
    }
  } else {
    const type = pickOne(['quadratic', 'alternating', 'geometric']);
    if (type === 'quadratic') {
      // n² + n pattern
      seq = Array.from({ length: 4 }, (_, i) => (i + 1) * (i + 1) + (i + 1));
      answer = 5 * 5 + 5;
    } else if (type === 'alternating') {
      // alternating +a, ×b
      const start = randInt(1, 5), addVal = randInt(1, 3), multVal = 2;
      seq = [start];
      for (let i = 1; i < 5; i++) {
        seq.push(i % 2 === 1 ? seq[i - 1] + addVal : seq[i - 1] * multVal);
      }
      answer = seq.length % 2 === 1 ? seq[seq.length - 1] + addVal : seq[seq.length - 1] * multVal;
      seq = seq.slice(0, 4);
    } else {
      const start = randInt(2, 5), ratio = pickOne([2, 3]);
      seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i));
      answer = seq.pop()!;
    }
  }

  const q = `${seq.join(', ')}, ?`;
  const { a, correct } = shuffleAnswers(String(answer), makeWrongAnswers(answer));
  return { q, a, correct, diff };
}

function generateMemoryNumbers(diff: Difficulty): Question {
  const len = diff === 'easy' ? 2 : diff === 'medium' ? 4 : 5;
  const seq = Array.from({ length: len }, () => randInt(1, 9));
  const posIdx = randInt(0, len - 1);
  const posLabel = ['FIRST', 'SECOND', 'THIRD', 'FOURTH', 'FIFTH'][posIdx];
  const correctVal = String(seq[posIdx]);

  // Generate distractors: other numbers not at that position
  const wrongs = new Set<string>();
  for (const n of seq) { if (String(n) !== correctVal) wrongs.add(String(n)); }
  while (wrongs.size < 3) { wrongs.add(String(randInt(1, 9))); wrongs.delete(correctVal); }

  const { a, correct } = shuffleAnswers(correctVal, Array.from(wrongs));
  return { q: `Remember: ${seq.join('-')}. What was ${posLabel}?`, a, correct, diff, memory: true };
}

function generateMemoryWords(diff: Difficulty): Question {
  const wordPool = ['Red', 'Blue', 'Green', 'Yellow', 'Cat', 'Dog', 'Bird', 'Fish',
    'Sun', 'Moon', 'Star', 'Sky', 'Tree', 'Rock', 'Lake', 'Sand',
    'Apple', 'Rain', 'Snow', 'Wind', 'Iron', 'Gold', 'North', 'East'];
  const len = diff === 'easy' ? 2 : diff === 'medium' ? 3 : 4;
  // Pick unique words
  const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
  const seq = shuffled.slice(0, len);
  const posIdx = randInt(0, len - 1);
  const posLabel = ['FIRST', 'SECOND', 'THIRD', 'FOURTH'][posIdx];
  const correctVal = seq[posIdx];

  const wrongs = new Set<string>();
  for (const w of seq) { if (w !== correctVal) wrongs.add(w); }
  while (wrongs.size < 3) {
    const extra = pickOne(shuffled.filter((w) => !seq.includes(w) && !wrongs.has(w)));
    if (extra) wrongs.add(extra); else break;
  }
  wrongs.delete(correctVal);

  const { a, correct } = shuffleAnswers(correctVal, Array.from(wrongs));
  return { q: `Remember: ${seq.join('-')}. What was ${posLabel}?`, a, correct, diff, memory: true };
}

// Map subcategories to their generator functions
const GENERATORS: Record<string, (diff: Difficulty) => Question | null> = {
  math_arithmetic: generateArithmetic,
  math_fractions: generateFraction,
  math_percent: generatePercent,
  math_missing: generateMissing,
  logic_patterns: generatePattern,
  memory_numbers: generateMemoryNumbers,
  memory_words: generateMemoryWords,
  memory_previous: generateMemoryPrevious,
};

// Track used questions to avoid repeats within a session
const usedQuestions = new Set<string>();

// ===== Game History Tracking (for memory_previous questions) =====
export interface HistoryEntry {
  question: Question;
  answerIdx: number | null;    // which answer was selected (null if timed out)
  playerName: string;          // who answered
  round: number;
}

const gameHistory: HistoryEntry[] = [];

export function recordHistory(entry: HistoryEntry): void {
  gameHistory.push(entry);
}

export function resetUsedQuestions(): void {
  usedQuestions.clear();
  gameHistory.length = 0;
}

function getCategoryLabel(q: Question): string {
  const text = q.q.toLowerCase();
  if (text.includes('binary') || text.includes('print') || text.includes('loop') || text.includes('bug') || text.includes('range') || text.includes('array')) return 'Comp. Thinking';
  if (text.includes('anagram') || text.includes('palindrome') || text.includes('analogy') || text.includes('odd one out')) return 'Word';
  if (text.includes('remember')) return 'Memory';
  if (text.includes('pattern') || text.includes('true') || text.includes('false') || text.includes('syllogism') || text.includes('all ') || text.includes('if ')) return 'Logic';
  return 'Math';
}

function generateMemoryPrevious(diff: Difficulty): Question | null {
  if (gameHistory.length < 2) return null; // Need some history to ask about

  const templates: Array<() => Question | null> = [];

  // "What category was question N?"
  if (gameHistory.length >= 1) {
    templates.push(() => {
      const idx = randInt(0, Math.min(gameHistory.length - 1, 4));
      const entry = gameHistory[idx];
      const correctCat = getCategoryLabel(entry.question);
      const allCats = ['Math', 'Logic', 'Memory', 'Word', 'Comp. Thinking'];
      const wrongs = allCats.filter((c) => c !== correctCat).sort(() => Math.random() - 0.5).slice(0, 3);
      const posLabel = ['1st', '2nd', '3rd', '4th', '5th'][idx];
      const { a, correct } = shuffleAnswers(correctCat, wrongs);
      return { q: `Remember: What category was the ${posLabel} question?`, a, correct, diff, memory: true };
    });
  }

  // "Who answered question N?"
  if (gameHistory.length >= 2) {
    templates.push(() => {
      const idx = randInt(0, Math.min(gameHistory.length - 1, 4));
      const entry = gameHistory[idx];
      const correctName = entry.playerName;
      const otherNames = [...new Set(gameHistory.map((h) => h.playerName).filter((n) => n !== correctName))];
      if (otherNames.length < 1) return null;
      while (otherNames.length < 3) otherNames.push(`Player ${otherNames.length + 2}`);
      const posLabel = ['1st', '2nd', '3rd', '4th', '5th'][idx];
      const { a, correct } = shuffleAnswers(correctName, otherNames.slice(0, 3));
      return { q: `Remember: Who answered the ${posLabel} question?`, a, correct, diff, memory: true };
    });
  }

  // "How many rounds have been played?"
  if (gameHistory.length >= 3) {
    templates.push(() => {
      const correctCount = gameHistory.length;
      const { a, correct } = shuffleAnswers(String(correctCount), makeWrongAnswers(correctCount));
      return { q: 'Remember: How many questions have been asked so far?', a, correct, diff, memory: true };
    });
  }

  // Difficulty filter: easy = category questions, medium = who answered, hard = all types
  let filtered = templates;
  if (diff === 'easy') filtered = templates.slice(0, 1);
  else if (diff === 'medium') filtered = templates.slice(0, 2);

  if (filtered.length === 0) return null;
  const gen = pickOne(filtered);
  return gen();
}

// Determine effective difficulty based on round progression
function getEffectiveDifficulty(baseDifficulty: Difficulty, round?: number): Difficulty {
  if (round == null) return baseDifficulty;
  // Progressive: mix in harder questions as rounds increase (gradual ramp)
  const levels: Difficulty[] = ['easy', 'medium', 'hard'];
  const baseIdx = levels.indexOf(baseDifficulty);
  let bump = 0;
  if (round >= 19) {
    const r = Math.random();
    bump = r < 0.25 ? 2 : r < 0.75 ? 1 : 0;
  } else if (round >= 13) {
    const r = Math.random();
    bump = r < 0.15 ? 2 : r < 0.55 ? 1 : 0;
  } else if (round >= 7) {
    bump = Math.random() < 0.3 ? 1 : 0;
  }
  return levels[Math.min(baseIdx + bump, 2)];
}

export function getRandomQuestion(
  activeSubs: Record<string, boolean>,
  difficulty: Difficulty,
  round?: number,
): Question {
  const effectiveDiff = getEffectiveDifficulty(difficulty, round);
  const enabledSubs = Object.keys(activeSubs).filter((k) => activeSubs[k]);

  // Split enabled subs into generator-capable and fixed-pool-only
  const generatableSubs = enabledSubs.filter((s) => GENERATORS[s]);
  const fixedOnlySubs = enabledSubs.filter((s) => !GENERATORS[s]);

  // Pick a random enabled sub, preferring generators when available
  if (enabledSubs.length > 0) {
    // Decide: pick from generator subs or fixed-only subs (weighted by count)
    const useGenerator = generatableSubs.length > 0 &&
      (fixedOnlySubs.length === 0 || Math.random() < generatableSubs.length / enabledSubs.length);

    if (useGenerator) {
      // Always use generator for generator-capable subs (never fall back to their fixed pool)
      const sub = pickOne(generatableSubs);
      const generated = GENERATORS[sub](effectiveDiff);
      if (generated) return generated;
      // Generator returned null (e.g. not enough history) — try another generator
      for (const s of generatableSubs) {
        const alt = GENERATORS[s](effectiveDiff);
        if (alt) return alt;
      }
      // All generators returned null, fall through to fixed pool
    }
  }

  // Fixed question pool — only use subcategories without generators
  let pool: Question[] = [];

  if (fixedOnlySubs.length > 0) {
    pool = fixedOnlySubs.flatMap((s) => QUESTIONS[s] || []);
  } else if (enabledSubs.length > 0) {
    // All enabled subs have generators but all returned null — use any enabled sub's fixed pool
    pool = enabledSubs.flatMap((s) => QUESTIONS[s] || []);
  }

  if (pool.length === 0) {
    pool = Object.values(QUESTIONS).flat();
  }

  // Filter by difficulty, fallback to all if empty
  const diffPool = pool.filter((q) => q.diff === effectiveDiff);
  const finalPool = diffPool.length > 0 ? diffPool : pool;

  // Filter out already-used questions
  const unused = finalPool.filter((q) => !usedQuestions.has(q.q));

  // If all used, reset and allow all again
  const pickFrom = unused.length > 0 ? unused : finalPool;
  if (unused.length === 0) {
    usedQuestions.clear();
  }

  const selected = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  usedQuestions.add(selected.q);
  return selected;
}

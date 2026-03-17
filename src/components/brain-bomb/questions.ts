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
    { q: 'If a|b and b|c, then a|c. True?', a: ['True','False','Sometimes','Only primes'], correct: 0, diff: 'hard' },
    { q: 'The set of real numbers is countable. True?', a: ['True','False \u2014 uncountable','Sometimes','Depends'], correct: 1, diff: 'hard' },
    { q: 'If A \u2229 B = \u2205, then |A \u222a B| = |A| + |B|. True?', a: ['True','False','Sometimes','Only finite sets'], correct: 0, diff: 'hard' },
    { q: 'Every continuous function is differentiable. True?', a: ['True','False \u2014 |x| at x=0','Sometimes','Only polynomials'], correct: 1, diff: 'hard' },
    { q: 'The empty set is a subset of every set. True?', a: ['True','False','Sometimes','Only finite sets'], correct: 0, diff: 'hard' },
    { q: 'log(ab) = log(a) + log(b). True?', a: ['True','False','Only for base 10','Only positive a,b'], correct: 0, diff: 'hard' },
    { q: '(a+b)\u00b2 = a\u00b2 + b\u00b2. True?', a: ['True','False \u2014 missing 2ab','Sometimes','Only if a=0'], correct: 1, diff: 'hard' },
    { q: 'A function can have two different outputs for the same input. True?', a: ['True','False','Sometimes','Only multivariable'], correct: 1, diff: 'hard' },
    { q: 'The sum of first n odd numbers equals n\u00b2. True?', a: ['True','False','Sometimes','Only small n'], correct: 0, diff: 'hard' },
    { q: 'If gcd(a,b) = 1, then a and b are coprime. True?', a: ['True','False','Sometimes','Only primes'], correct: 0, diff: 'hard' },
    { q: 'Every square matrix has an inverse. True?', a: ['True','False \u2014 only if det\u22600','Sometimes','Only 2\u00d72'], correct: 1, diff: 'hard' },
    { q: '0! = 0. True?', a: ['True','False \u2014 0! = 1','Sometimes','Undefined'], correct: 1, diff: 'hard' },
    { q: 'Is 2 + 2 = 4?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is a pentagon a shape with 5 sides?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 10 an odd number?', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is ice made of water?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 50 greater than 100?', a: ['True','False','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is a hexagon a shape with 6 sides?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 3 \u00d7 3 = 6?', a: ['True','False \u2014 it is 9','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is every whole number also an integer?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Does a cube have 8 corners?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 12 divisible by 4?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is 0 an even number?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Does a rectangle have 4 right angles?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'The sum of any number and zero is zero. True?', a: ['True','False \u2014 it is the number itself','Sometimes','Depends'], correct: 1, diff: 'medium' },
    { q: 'A rhombus has all sides equal. True?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Negative times negative is always negative. True?', a: ['True','False \u2014 it is positive','Sometimes','Depends'], correct: 1, diff: 'medium' },
    { q: 'A prime number has exactly two factors. True?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'The diagonal of a square equals its side \u00d7 \u221a2. True?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Every multiple of 4 is also a multiple of 2. True?', a: ['True','False','Sometimes','Only for positives'], correct: 0, diff: 'medium' },
    { q: 'A cylinder has two circular faces. True?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'An integer divided by itself is always 1. True?', a: ['True','False \u2014 0/0 is undefined','Sometimes','Only positives'], correct: 1, diff: 'medium' },
    { q: 'The angles of any triangle sum to 180\u00b0. True?', a: ['True','False','Sometimes','Only right triangles'], correct: 0, diff: 'medium' },
    { q: 'All integers are rational numbers. True?', a: ['True','False','Sometimes','Only positives'], correct: 0, diff: 'medium' },
    { q: 'A trapezoid has exactly one pair of parallel sides. True?', a: ['True','False','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'The perimeter of a circle is called the circumference. True?', a: ['True','False','Sometimes','Only large circles'], correct: 0, diff: 'medium' },
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
    { q: 'Odd one out: Apple, Pear, Grape, Carrot', a: ['Apple','Pear','Grape','Carrot'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Fork, Spoon, Knife, Shoe', a: ['Fork','Spoon','Knife','Shoe'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: One, Two, Three, Yellow', a: ['One','Two','Three','Yellow'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Lion, Tiger, Bear, Tulip', a: ['Lion','Tiger','Bear','Tulip'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Rain, Snow, Hail, Bread', a: ['Rain','Snow','Hail','Bread'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Guitar, Piano, Drum, Book', a: ['Guitar','Piano','Drum','Book'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: January, March, Summer, July', a: ['January','March','Summer','July'], correct: 2, diff: 'easy' },
    { q: 'Odd one out: River, Lake, Ocean, Mountain', a: ['River','Lake','Ocean','Mountain'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Shirt, Jacket, Pants, Hammer', a: ['Shirt','Jacket','Pants','Hammer'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Circle, Square, Triangle, Apple', a: ['Circle','Square','Triangle','Apple'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: A, B, C, 7', a: ['A','B','C','7'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Water, Juice, Milk, Chair', a: ['Water','Juice','Milk','Chair'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Salmon, Tuna, Cow, Trout', a: ['Salmon','Tuna','Cow','Trout'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Tokyo, Paris, Africa, London', a: ['Tokyo','Paris','Africa','London'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Spring, Autumn, December, Summer', a: ['Spring','Autumn','December','Summer'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Gold, Silver, Bronze, Iron', a: ['Gold','Silver','Bronze','Iron'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Celsius, Fahrenheit, Kelvin, Kilogram', a: ['Celsius','Fahrenheit','Kelvin','Kilogram'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Oak, Pine, Maple, Daisy', a: ['Oak','Pine','Maple','Daisy'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Jupiter, Saturn, Neptune, Moon', a: ['Jupiter','Saturn','Neptune','Moon'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Brake, Tire, Wheel, Anchor', a: ['Brake','Tire','Wheel','Anchor'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: French, Spanish, Italian, Canadian', a: ['French','Spanish','Italian','Canadian'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Violin, Cello, Trumpet, Viola', a: ['Violin','Cello','Trumpet','Viola'], correct: 2, diff: 'medium' },
    { q: 'Odd one out: Photosynthesis, Respiration, Digestion, Evaporation', a: ['Photosynthesis','Respiration','Digestion','Evaporation'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Addition, Subtraction, Division, Equation', a: ['Addition','Subtraction','Division','Equation'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Irony, Metaphor, Simile, Paragraph', a: ['Irony','Metaphor','Simile','Paragraph'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Proton, Neutron, Electron, Photon', a: ['Proton','Neutron','Electron','Photon'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Picasso, Monet, Beethoven, Rembrandt', a: ['Picasso','Monet','Beethoven','Rembrandt'], correct: 2, diff: 'hard' },
    { q: 'Odd one out: Sonata, Symphony, Concerto, Sculpture', a: ['Sonata','Symphony','Concerto','Sculpture'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Haiku, Sonnet, Limerick, Chapter', a: ['Haiku','Sonnet','Limerick','Chapter'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Hypothesis, Theory, Law, Opinion', a: ['Hypothesis','Theory','Law','Opinion'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Mitosis, Meiosis, Osmosis, Photosynthesis', a: ['Mitosis','Meiosis','Osmosis','Photosynthesis'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Renaissance, Baroque, Gothic, Industrial', a: ['Renaissance','Baroque','Gothic','Industrial'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Plato, Aristotle, Socrates, Newton', a: ['Plato','Aristotle','Socrates','Newton'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Allegory, Parable, Fable, Essay', a: ['Allegory','Parable','Fable','Essay'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Binary, Octal, Hexadecimal, Alphabetical', a: ['Binary','Octal','Hexadecimal','Alphabetical'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Feudalism, Capitalism, Socialism, Metabolism', a: ['Feudalism','Capitalism','Socialism','Metabolism'], correct: 3, diff: 'hard' },
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
    { q: 'All toys are fun. A ball is a toy. Is it fun?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All vegetables are healthy. Broccoli is a vegetable. Is it healthy?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'No birds are insects. A bee is an insect. Is a bee a bird?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'easy' },
    { q: 'All cats have whiskers. Tom is a cat. Does Tom have whiskers?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All books have pages. This is a book. Does it have pages?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All ice cream is cold. This is ice cream. Is it cold?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'No plants are animals. A fern is a plant. Is it an animal?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'easy' },
    { q: 'All stars shine. The Sun is a star. Does it shine?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'All coins are round. This is round. Is it a coin?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'easy' },
    { q: 'All puppies are young. Max is young. Is Max a puppy?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'easy' },
    { q: 'All snakes are cold-blooded. A cobra is a snake. Is it cold-blooded?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'easy' },
    { q: 'No rocks can swim. A pebble is a rock. Can it swim?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'easy' },
    { q: 'All doctors are smart. Some smart people are funny. Are all doctors funny?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'Some flowers are red. All red things are visible. Are some flowers visible?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 0, diff: 'medium' },
    { q: 'All birds have feathers. Penguins are birds. Do penguins have feathers?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'No vegetables are sweet. Carrots are vegetables. Are carrots sweet?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 1, diff: 'medium' },
    { q: 'All athletes exercise. Some athletes are tall. Do all tall people exercise?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'All metals conduct electricity. Copper is a metal. Does copper conduct?', a: ['Yes','No','Maybe','Unknown'], correct: 0, diff: 'medium' },
    { q: 'Some students play guitar. All guitar players have hands. Do some students have hands?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 0, diff: 'medium' },
    { q: 'All teachers are patient. Ms. Lee is patient. Is Ms. Lee a teacher?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'All dogs are loyal. Some loyal animals are pets. Are all dogs pets?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'No fish can fly. Salmon is a fish. Can salmon fly?', a: ['Yes','No','Maybe','Unknown'], correct: 1, diff: 'medium' },
    { q: 'All computers use electricity. Phones use electricity. Are phones computers?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'Some musicians are singers. All singers have voices. Do all musicians have voices?', a: ['Yes','No','Maybe','Can\'t tell'], correct: 3, diff: 'medium' },
    { q: 'All A are B. Some B are not C. Must some A not be C?', a: ['Yes','No','Can\'t tell','Always'], correct: 2, diff: 'hard' },
    { q: 'No X are Y. All Z are X. Can any Z be Y?', a: ['Yes','No','Some can','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'Some A are B. Some B are C. All C are D. Must some A be D?', a: ['Yes','No','Can\'t tell','Sometimes'], correct: 2, diff: 'hard' },
    { q: 'All poets are dreamers. No dreamers are practical. Can a poet be practical?', a: ['Yes','No','Sometimes','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'Some X are Y. No Y are Z. Can all X be Z?', a: ['Yes','No','Some can','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'All squares are shapes. All shapes have area. Must all squares have area?', a: ['Yes','No','Sometimes','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'No mammals lay eggs. Platypuses are mammals. Do they lay eggs? (Logic only)', a: ['Yes','No (by logic)','Maybe','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'All A are B. No C are B. Some D are A. Can any D be C?', a: ['Yes','No','Some can','Can\'t tell'], correct: 1, diff: 'hard' },
    { q: 'Some singers are actors. All actors are famous. Are some singers famous?', a: ['Yes','No','Can\'t tell','Sometimes'], correct: 0, diff: 'hard' },
    { q: 'All P are Q. All Q are R. Some R are S. Must some P be S?', a: ['Yes','No','Can\'t tell','Always'], correct: 2, diff: 'hard' },
    { q: 'No A are B. Some C are A. Some C are B. Is this possible?', a: ['Yes','No','Only sometimes','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'All X are Y. Some Y are Z. All Z are W. Must all X be W?', a: ['Yes','No','Can\'t tell','Sometimes'], correct: 2, diff: 'hard' },
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
    { q: 'What is 5 in binary?', a: ['100','101','110','111'], correct: 1, diff: 'easy' },
    { q: 'What is binary 100 in decimal?', a: ['2','3','4','5'], correct: 2, diff: 'easy' },
    { q: 'What is 2 in binary?', a: ['01','10','11','100'], correct: 1, diff: 'easy' },
    { q: 'What is binary 1 in decimal?', a: ['0','1','2','10'], correct: 1, diff: 'easy' },
    { q: 'What is 6 in binary?', a: ['101','110','111','1000'], correct: 1, diff: 'easy' },
    { q: 'How many bits does 3 need in binary?', a: ['1','2','3','4'], correct: 1, diff: 'easy' },
    { q: 'What is binary 110 in decimal?', a: ['4','5','6','7'], correct: 2, diff: 'easy' },
    { q: 'What is binary 111 in decimal?', a: ['5','6','7','8'], correct: 2, diff: 'easy' },
    { q: 'Is 1001 odd or even in binary?', a: ['Odd','Even','Neither','Both'], correct: 0, diff: 'easy' },
    { q: 'What is the largest 3-bit binary number in decimal?', a: ['6','7','8','9'], correct: 1, diff: 'easy' },
    { q: 'What is binary 0 + binary 1?', a: ['0','1','10','01'], correct: 1, diff: 'easy' },
    { q: 'What is 7 in binary?', a: ['101','110','111','1000'], correct: 2, diff: 'easy' },
    { q: 'What is 9 in binary?', a: ['1000','1001','1010','1011'], correct: 1, diff: 'medium' },
    { q: 'What is binary 1110 in decimal?', a: ['12','13','14','15'], correct: 2, diff: 'medium' },
    { q: 'What is 12 in binary?', a: ['1010','1011','1100','1101'], correct: 2, diff: 'medium' },
    { q: 'What is 10 in binary?', a: ['1001','1010','1011','1100'], correct: 1, diff: 'medium' },
    { q: 'What is binary 1001 in decimal?', a: ['7','8','9','10'], correct: 2, diff: 'medium' },
    { q: 'What is binary 10000 in decimal?', a: ['8','16','32','64'], correct: 1, diff: 'medium' },
    { q: 'What is 13 in binary?', a: ['1011','1100','1101','1110'], correct: 2, diff: 'medium' },
    { q: 'What is binary 1011 in decimal?', a: ['9','10','11','12'], correct: 2, diff: 'medium' },
    { q: 'How many bits does 16 need?', a: ['4','5','6','3'], correct: 1, diff: 'medium' },
    { q: 'What is 14 in binary?', a: ['1100','1101','1110','1111'], correct: 2, diff: 'medium' },
    { q: 'What is binary 0011 + 0001?', a: ['0100','0010','0101','0110'], correct: 0, diff: 'medium' },
    { q: 'What is the largest 4-bit number in decimal?', a: ['14','15','16','17'], correct: 1, diff: 'medium' },
    { q: 'What is 50 in binary?', a: ['110010','101010','110100','100110'], correct: 0, diff: 'hard' },
    { q: 'What is binary 101010 in decimal?', a: ['40','41','42','43'], correct: 2, diff: 'hard' },
    { q: 'What is 64 in binary?', a: ['111111','1000000','100000','1100000'], correct: 1, diff: 'hard' },
    { q: 'What is binary 11111 in decimal?', a: ['29','30','31','32'], correct: 2, diff: 'hard' },
    { q: 'What is 1100 + 0011 in binary?', a: ['1111','10000','1110','1101'], correct: 0, diff: 'hard' },
    { q: 'What is 100 in binary?', a: ['1100100','1100010','1010100','1001100'], correct: 0, diff: 'hard' },
    { q: 'What is binary 1000000 in decimal?', a: ['32','48','64','128'], correct: 2, diff: 'hard' },
    { q: 'What is 128 in binary?', a: ['1111111','10000000','11000000','1000000'], correct: 1, diff: 'hard' },
    { q: 'What is 1010 \u00d7 10 in binary?', a: ['10100','11000','10010','11100'], correct: 0, diff: 'hard' },
    { q: 'How many bits does 100 need?', a: ['6','7','8','5'], correct: 1, diff: 'hard' },
    { q: 'What is binary 1010101 in decimal?', a: ['83','84','85','86'], correct: 2, diff: 'hard' },
    { q: 'What is the binary of 200?', a: ['11001000','11000100','10110000','11010000'], correct: 0, diff: 'hard' },
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
    { q: 'What prints? x=2; x=x+3; print x', a: ['2','3','5','6'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=7; x=x-3; print x', a: ['3','4','7','10'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=4; x=x*3; print x', a: ['7','12','4','3'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=9; print x+1', a: ['9','10','11','91'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=6; y=2; print x-y', a: ['2','3','4','6'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=20; x=x/4; print x', a: ['4','5','16','20'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=1; x=x+1; x=x+1; print x', a: ['1','2','3','4'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=0; print x', a: ['0','nothing','error','null'], correct: 0, diff: 'easy' },
    { q: 'What prints? x=10; y=x; print y', a: ['x','10','y','error'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=3; x=x*x; print x', a: ['3','6','9','27'], correct: 2, diff: 'easy' },
    { q: 'What prints? x=15; x=x-5; print x', a: ['5','10','15','20'], correct: 1, diff: 'easy' },
    { q: 'What prints? x=2; y=3; print x*y', a: ['5','6','23','32'], correct: 1, diff: 'easy' },
    { q: 'What data structure uses LIFO?', a: ['Queue','Stack','Array','Tree'], correct: 1, diff: 'medium' },
    { q: 'x=10; y=20; x=y; y=x; What is y?', a: ['10','20','30','error'], correct: 1, diff: 'medium' },
    { q: 'Array [10,20,30]. What is arr[2]?', a: ['10','20','30','error'], correct: 2, diff: 'medium' },
    { q: 'x=5; y=x%2; What is y?', a: ['0','1','2','3'], correct: 1, diff: 'medium' },
    { q: 'What is a variable?', a: ['A loop','A named storage','A function','An error'], correct: 1, diff: 'medium' },
    { q: 'x="ab"; y="cd"; print x+y', a: ['abcd','ab cd','error','abyd'], correct: 0, diff: 'medium' },
    { q: 'Array [1,2,3,4]. What is length?', a: ['3','4','5','1'], correct: 1, diff: 'medium' },
    { q: 'x=true; y=false; print x AND y', a: ['true','false','error','null'], correct: 1, diff: 'medium' },
    { q: 'What does an assignment operator do?', a: ['Compares','Stores a value','Loops','Returns'], correct: 1, diff: 'medium' },
    { q: 'x=7; y=3; print x//y (integer division)', a: ['2','2.33','3','1'], correct: 0, diff: 'medium' },
    { q: 'What is a constant?', a: ['A changing value','A fixed value','A function','A loop'], correct: 1, diff: 'medium' },
    { q: 'x="hello"; print x[0]', a: ['h','e','hello','error'], correct: 0, diff: 'medium' },
    { q: 'HashMap: get key that does not exist returns?', a: ['0','null/None','error always','empty string'], correct: 1, diff: 'hard' },
    { q: 'x={a:1,b:2}; print x["a"]', a: ['1','2','a','error'], correct: 0, diff: 'hard' },
    { q: 'What is O(log n) called?', a: ['Linear','Quadratic','Logarithmic','Constant'], correct: 2, diff: 'hard' },
    { q: 'x=[1,2]; y=x; y.append(3); What is len(x)?', a: ['2','3','1','error'], correct: 1, diff: 'hard' },
    { q: 'What does recursion mean?', a: ['A loop','A function calling itself','An error','A variable'], correct: 1, diff: 'hard' },
    { q: 'x="abc"; print x[-1]', a: ['a','b','c','error'], correct: 2, diff: 'hard' },
    { q: 'Binary search requires the list to be?', a: ['Empty','Sorted','Reversed','Random'], correct: 1, diff: 'hard' },
    { q: 'x=[[1,2],[3,4]]; print x[1][0]', a: ['1','2','3','4'], correct: 2, diff: 'hard' },
    { q: 'What is a linked list?', a: ['An array','Nodes with pointers','A tree','A stack'], correct: 1, diff: 'hard' },
    { q: 'set([1,2,2,3]) produces?', a: ['{1,2,3}','{1,2,2,3}','[1,2,3]','error'], correct: 0, diff: 'hard' },
    { q: 'What is the time complexity of accessing arr[i]?', a: ['O(1)','O(n)','O(log n)','O(n\u00b2)'], correct: 0, diff: 'hard' },
    { q: 'x="hello"; print x[1:3]', a: ['he','el','ell','hel'], correct: 1, diff: 'hard' },
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
    { q: 'What does "repeat" mean in coding?', a: ['Stop','Do again','Delete','Save'], correct: 1, diff: 'easy' },
    { q: 'How many times: repeat 5 times: wave', a: ['3','4','5','6'], correct: 2, diff: 'easy' },
    { q: 'repeat 2 times: say "yo". How many "yo"s?', a: ['1','2','3','4'], correct: 1, diff: 'easy' },
    { q: 'A "for" loop repeats a ___ number of times.', a: ['Random','Known','Unknown','Infinite'], correct: 1, diff: 'easy' },
    { q: 'repeat 0 times: clap. How many claps?', a: ['0','1','2','infinity'], correct: 0, diff: 'easy' },
    { q: 'What happens after a loop finishes?', a: ['Repeats forever','Goes to next line','Crashes','Restarts'], correct: 1, diff: 'easy' },
    { q: 'repeat 4 times: print "A". Output?', a: ['AAAA','A','AAAAAAA','AA'], correct: 0, diff: 'easy' },
    { q: 'Can a loop run inside another loop?', a: ['Yes','No','Only once','Only in Python'], correct: 0, diff: 'easy' },
    { q: 'repeat 10 times: step. How many steps?', a: ['5','8','10','12'], correct: 2, diff: 'easy' },
    { q: 'A loop that runs 1 time is called?', a: ['Infinite loop','Single iteration','Dead loop','No loop'], correct: 1, diff: 'easy' },
    { q: 'How many times: repeat 3 times: jump twice', a: ['3','6','9','2'], correct: 1, diff: 'easy' },
    { q: 'What is the first value of i in: for i in range(5)?', a: ['0','1','5','error'], correct: 0, diff: 'easy' },
    { q: 'for i in range(1,4): print i. What prints?', a: ['1,2,3','1,2,3,4','0,1,2,3','0,1,2'], correct: 0, diff: 'medium' },
    { q: 'x=0; for i in [2,4,6]: x+=i; What is x?', a: ['6','10','12','8'], correct: 2, diff: 'medium' },
    { q: 'What is the last value of i in: for i in range(5)?', a: ['4','5','3','0'], correct: 0, diff: 'medium' },
    { q: 'x=1; while x<=8: x*=2; What is final x?', a: ['8','16','4','32'], correct: 1, diff: 'medium' },
    { q: 'for i in range(2,10,2): count. How many loops?', a: ['3','4','5','8'], correct: 1, diff: 'medium' },
    { q: 'x=20; while x>0: x-=7; What is final x?', a: ['-1','-2','0','1'], correct: 0, diff: 'medium' },
    { q: 'for i in "hello": count. How many loops?', a: ['4','5','6','1'], correct: 1, diff: 'medium' },
    { q: 'x=0; for i in range(5): if i>2: x+=1; What is x?', a: ['1','2','3','5'], correct: 1, diff: 'medium' },
    { q: 'What is the output of: for i in range(0): print(i)?', a: ['0','nothing','error','infinite'], correct: 1, diff: 'medium' },
    { q: 'x=1; for i in range(5): x+=x; What is x?', a: ['16','32','64','10'], correct: 1, diff: 'medium' },
    { q: 'for i in range(3): for j in range(2): print("*"). How many *?', a: ['5','6','3','2'], correct: 1, diff: 'medium' },
    { q: 'while x!=0: x-=1; If x=5, how many loops?', a: ['4','5','6','infinite'], correct: 1, diff: 'medium' },
    { q: 'for i in range(1,100): if i%7==0: count+=1; count=?', a: ['13','14','15','99'], correct: 1, diff: 'hard' },
    { q: 'x=1; for i in range(10): x=x*2; What is x?', a: ['512','1024','2048','256'], correct: 1, diff: 'hard' },
    { q: 'Nested loop 4x5: total iterations?', a: ['9','15','20','25'], correct: 2, diff: 'hard' },
    { q: 'x=0; for i in range(10): if i%2==0: x+=i; What is x?', a: ['20','25','30','15'], correct: 0, diff: 'hard' },
    { q: 'while True: x+=1; if x%5==0: break; x starts at 0. Final x?', a: ['4','5','10','1'], correct: 1, diff: 'hard' },
    { q: 'for i in range(1,11): if i%3==0: sum+=i; sum=?', a: ['9','18','27','36'], correct: 1, diff: 'hard' },
    { q: 'x=1024; while x>1: x=x//2; count+=1; count=?', a: ['9','10','11','12'], correct: 1, diff: 'hard' },
    { q: 'x=0; for i in range(5): for j in range(i): x+=1; What is x?', a: ['5','10','15','20'], correct: 1, diff: 'hard' },
    { q: 'for i in range(100): if i%10==0: count+=1; count=?', a: ['9','10','11','100'], correct: 1, diff: 'hard' },
    { q: 'x=3; while x<1000: x=x*3; How many loops?', a: ['5','6','7','8'], correct: 1, diff: 'hard' },
    { q: 'for i in range(1,21): if i%4==0 and i%6==0: count+=1; count=?', a: ['1','2','3','4'], correct: 0, diff: 'hard' },
    { q: 'x=0; for i in range(5): x+=i*i; What is x?', a: ['25','30','55','14'], correct: 1, diff: 'hard' },
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
    { q: 'print("Hi) \u2014 what is the bug?', a: ['Missing closing quote','Missing semicolon','Wrong function','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = 5 ++ 3 \u2014 what is the bug?', a: ['Double operator','Missing variable','Wrong number','No bug'], correct: 0, diff: 'easy' },
    { q: 'prrint("yo") \u2014 what is the bug?', a: ['Typo: prrint','Missing quotes','Wrong brackets','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = "hi" + "there \u2014 what is the bug?', a: ['Missing closing quote','Missing +','Wrong variable','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = 10 * \u2014 what is the bug?', a: ['Missing second number','Missing semicolon','Wrong operator','No bug'], correct: 0, diff: 'easy' },
    { q: 'print(Hello) \u2014 what is the bug?', a: ['Missing quotes around Hello','Missing semicolon','Wrong function','No bug'], correct: 0, diff: 'easy' },
    { q: 'x == 5 \u2014 this assigns 5 to x. True?', a: ['True','False \u2014 == is comparison','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'x = 3 + "2" \u2014 potential bug?', a: ['Type mismatch','Syntax error','No bug','Missing quote'], correct: 0, diff: 'easy' },
    { q: 'pint("test") \u2014 what is the bug?', a: ['Typo: pint','Missing quotes','Wrong brackets','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = [1, 2, 3 \u2014 what is the bug?', a: ['Missing closing bracket','Missing comma','Wrong syntax','No bug'], correct: 0, diff: 'easy' },
    { q: 'print("hi"; \u2014 what is the bug?', a: ['Missing closing parenthesis','Missing semicolon','Wrong quotes','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = 5 / \u2014 what is the bug?', a: ['Missing divisor','Missing semicolon','Wrong operator','No bug'], correct: 0, diff: 'easy' },
    { q: 'x = [1,2,3]; print(x[1]) \u2014 what prints?', a: ['1','2','3','error'], correct: 1, diff: 'medium' },
    { q: 'if x > 5: elif x < 3: \u2014 the bug is?', a: ['Missing code between if and elif','No bug','Wrong syntax','Missing colon'], correct: 0, diff: 'medium' },
    { q: 'x = True; if x = True: print("yes") \u2014 bug?', a: ['= should be ==','No bug','Missing colon','Wrong indent'], correct: 0, diff: 'medium' },
    { q: 'for i in range(5) print(i) \u2014 bug?', a: ['Missing colon after range(5)','No bug','Wrong range','Missing print'], correct: 0, diff: 'medium' },
    { q: 'x = {"a": 1}; print(x["b"]) \u2014 bug?', a: ['Key "b" does not exist','No bug','Wrong syntax','Missing comma'], correct: 0, diff: 'medium' },
    { q: 'def add(a, b) return a+b \u2014 bug?', a: ['Missing colon after def','No bug','Wrong return','Missing def'], correct: 0, diff: 'medium' },
    { q: 'x = 10; while x > 0: x += 1 \u2014 bug?', a: ['Infinite loop \u2014 x grows','No bug','Wrong operator','Missing break'], correct: 0, diff: 'medium' },
    { q: 'print("result: " + 42) \u2014 bug?', a: ['Type error \u2014 string + int','No bug','Missing quotes','Wrong operator'], correct: 0, diff: 'medium' },
    { q: 'x = []; print(x[0]) \u2014 bug?', a: ['Index out of range \u2014 list is empty','No bug','Wrong syntax','Missing value'], correct: 0, diff: 'medium' },
    { q: 'def f(): x = 5; print(x) outside f \u2014 bug?', a: ['x is not defined outside f','No bug','Wrong function','Missing return'], correct: 0, diff: 'medium' },
    { q: 'x = None; print(x + 1) \u2014 bug?', a: ['Cannot add None and int','No bug','Wrong variable','Missing value'], correct: 0, diff: 'medium' },
    { q: 'if True: pass else: print("no") \u2014 bug?', a: ['Missing newline before else','No bug','Wrong condition','Missing colon'], correct: 0, diff: 'medium' },
    { q: 'def f(x=[]): x.append(1); return x \u2014 bug?', a: ['Mutable default argument','No bug','Wrong return','Missing def'], correct: 0, diff: 'hard' },
    { q: 'x = {1: "a", 1: "b"}; print(x[1]) \u2014 what prints?', a: ['a','b','error','both'], correct: 1, diff: 'hard' },
    { q: 'x = [1,2,3]; y = x; y[0] = 99; print(x[0]) \u2014 prints?', a: ['1','99','error','[99,2,3]'], correct: 1, diff: 'hard' },
    { q: 'for i in range(3): pass; print(i) \u2014 prints?', a: ['error','0','2','nothing'], correct: 2, diff: 'hard' },
    { q: 'x = "hello"; x[0] = "H" \u2014 bug?', a: ['Strings are immutable','No bug','Wrong index','Missing quotes'], correct: 0, diff: 'hard' },
    { q: 'import math; print(math.sqrt(-1)) \u2014 bug?', a: ['ValueError \u2014 negative sqrt','No bug','Import error','Missing math'], correct: 0, diff: 'hard' },
    { q: 'x = 0.1 + 0.2; print(x == 0.3) \u2014 prints?', a: ['True','False \u2014 floating point','error','0.3'], correct: 1, diff: 'hard' },
    { q: 'class Dog: def bark(self): print("woof"); Dog.bark() \u2014 bug?', a: ['Missing self argument','No bug','Wrong class','Missing def'], correct: 0, diff: 'hard' },
    { q: 'x = [1,2,3]; for i in x: x.remove(i) \u2014 bug?', a: ['Modifying list while iterating','No bug','Wrong syntax','Missing break'], correct: 0, diff: 'hard' },
    { q: 'try: x=1/0; except: pass \u2014 is this good practice?', a: ['No \u2014 bare except hides errors','Yes','Sometimes','Only in Python'], correct: 0, diff: 'hard' },
    { q: 'x = int("abc") \u2014 bug?', a: ['ValueError \u2014 cannot convert','No bug','Wrong function','Missing quotes'], correct: 0, diff: 'hard' },
    { q: 'x = [1,2]; del x[5] \u2014 bug?', a: ['Index out of range','No bug','Wrong syntax','Missing value'], correct: 0, diff: 'hard' },
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
    { q: 'Anagram of BAT?', a: ['TAB','ABT','BTA','TBA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of NET?', a: ['TEN','ENT','NTE','TNE'], correct: 0, diff: 'easy' },
    { q: 'Anagram of TIP?', a: ['PIT','IPT','TPI','ITP'], correct: 0, diff: 'easy' },
    { q: 'Anagram of RAP?', a: ['PAR','APR','RPA','PRA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of GOD?', a: ['DOG','OGD','GDO','ODG'], correct: 0, diff: 'easy' },
    { q: 'Anagram of NOW?', a: ['WON','ONW','NWO','OWN'], correct: 0, diff: 'easy' },
    { q: 'Anagram of SAW?', a: ['WAS','ASW','SWA','WSA'], correct: 0, diff: 'easy' },
    { q: 'Anagram of ATE?', a: ['EAT','TEA','ETA','All of these'], correct: 3, diff: 'easy' },
    { q: 'Anagram of ERA?', a: ['ARE','EAR','REA','All of these'], correct: 1, diff: 'easy' },
    { q: 'Anagram of OPT?', a: ['POT','TOP','OTP','All of these'], correct: 1, diff: 'easy' },
    { q: 'Anagram of ARM?', a: ['MAR','RAM','RMA','MRA'], correct: 1, diff: 'easy' },
    { q: 'Anagram of TEA?', a: ['ATE','EAT','ETA','All of these'], correct: 3, diff: 'easy' },
    { q: 'Anagram of LEMON?', a: ['MELON','MONEL','LOMEN','NOLEM'], correct: 0, diff: 'medium' },
    { q: 'Anagram of ANGEL?', a: ['GLEAN','ANGLE','GENAL','All of these'], correct: 1, diff: 'medium' },
    { q: 'Anagram of BELOW?', a: ['ELBOW','BOWEL','LOWBE','BWOLE'], correct: 0, diff: 'medium' },
    { q: 'Anagram of STUDY?', a: ['DUSTY','STUYD','DYTUS','YUTSD'], correct: 0, diff: 'medium' },
    { q: 'Anagram of FIRED?', a: ['FRIED','RIDER','DFIRE','REFIT'], correct: 0, diff: 'medium' },
    { q: 'Anagram of PARTS?', a: ['TRAPS','STRAP','TARPS','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of OCEAN?', a: ['CANOE','ACONE','NOCEA','OANCE'], correct: 0, diff: 'medium' },
    { q: 'Anagram of CAUSE?', a: ['SAUCE','ACUSE','CEAUS','USECA'], correct: 0, diff: 'medium' },
    { q: 'Anagram of THING?', a: ['NIGHT','THIGN','GNITH','HINGT'], correct: 0, diff: 'medium' },
    { q: 'Anagram of CHARM?', a: ['MARCH','MCHAR','ARCMH','HCRAM'], correct: 0, diff: 'medium' },
    { q: 'Anagram of CRATE?', a: ['TRACE','REACT','CATER','All of these'], correct: 3, diff: 'medium' },
    { q: 'Anagram of DIARY?', a: ['DAIRY','YARID','RAIDY','DIRYA'], correct: 0, diff: 'medium' },
    { q: 'Anagram of DESPAIR?', a: ['PRAISED','DIAPERS','ASPIRED','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of ADMIRER?', a: ['MARRIED','READMIR','MIDRERA','RIDEARM'], correct: 0, diff: 'hard' },
    { q: 'Anagram of ANGERED?', a: ['ENRAGED','GRANDEE','GRENADE','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of SECTION?', a: ['NOTICES','SNOETIC','INCOTES','CTONISE'], correct: 0, diff: 'hard' },
    { q: 'Anagram of MASTER?', a: ['STREAM','MATERS','TAMERS','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of PRESENT?', a: ['SERPENT','REPENTS','PRETENS','TREPENS'], correct: 1, diff: 'hard' },
    { q: 'Anagram of SEARCH?', a: ['ARCHES','CHASER','ESCHAR','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of DECIMAL?', a: ['CLAIMED','MEDICAL','DECLAIM','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of ARTICLE?', a: ['RECITAL','CLATTER','RACTILE','LACITER'], correct: 0, diff: 'hard' },
    { q: 'Anagram of STAPLE?', a: ['PETALS','PASTEL','PLATES','All of these'], correct: 3, diff: 'hard' },
    { q: 'Anagram of PAINTER?', a: ['REPAINT','PERTAIN','CERTAIN','Both A and B'], correct: 3, diff: 'hard' },
    { q: 'Anagram of STORAGE?', a: ['ORGEATS','GAROTES','OSTRAGE','TOGSARE'], correct: 0, diff: 'hard' },
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
    { q: 'Happy : Sad :: Fast : ?', a: ['Quick','Slow','Run','Speed'], correct: 1, diff: 'easy' },
    { q: 'Cow : Milk :: Hen : ?', a: ['Feather','Egg','Chick','Nest'], correct: 1, diff: 'easy' },
    { q: 'Brother : Sister :: Uncle : ?', a: ['Aunt','Mother','Cousin','Father'], correct: 0, diff: 'easy' },
    { q: 'Fire : Hot :: Ice : ?', a: ['White','Cold','Wet','Hard'], correct: 1, diff: 'easy' },
    { q: 'Teacher : School :: Doctor : ?', a: ['Medicine','Hospital','Patient','Nurse'], correct: 1, diff: 'easy' },
    { q: 'Pen : Write :: Knife : ?', a: ['Sharp','Cut','Metal','Kitchen'], correct: 1, diff: 'easy' },
    { q: 'Fish : Water :: Bird : ?', a: ['Nest','Tree','Air','Fly'], correct: 2, diff: 'easy' },
    { q: 'King : Queen :: Prince : ?', a: ['Princess','Duke','Knight','Lady'], correct: 0, diff: 'easy' },
    { q: 'Rain : Wet :: Sun : ?', a: ['Hot','Dry','Bright','Yellow'], correct: 1, diff: 'easy' },
    { q: 'Bee : Honey :: Cow : ?', a: ['Milk','Grass','Farm','Meat'], correct: 0, diff: 'easy' },
    { q: 'Eye : See :: Nose : ?', a: ['Face','Breathe','Smell','Sneeze'], correct: 2, diff: 'easy' },
    { q: 'Night : Moon :: Day : ?', a: ['Cloud','Sun','Light','Morning'], correct: 1, diff: 'easy' },
    { q: 'Seed : Tree :: Egg : ?', a: ['Nest','Bird','Shell','Chicken'], correct: 1, diff: 'medium' },
    { q: 'Bark : Dog :: Meow : ?', a: ['Mouse','Cat','Bird','Fish'], correct: 1, diff: 'medium' },
    { q: 'Captain : Ship :: Pilot : ?', a: ['Sky','Airplane','Airport','Wings'], correct: 1, diff: 'medium' },
    { q: 'Lens : Camera :: Screen : ?', a: ['Movie','Television','Picture','Remote'], correct: 1, diff: 'medium' },
    { q: 'Flock : Birds :: Herd : ?', a: ['Fish','Wolves','Cattle','Bees'], correct: 2, diff: 'medium' },
    { q: 'Silk : Worm :: Wool : ?', a: ['Cotton','Sheep','Goat','Fabric'], correct: 1, diff: 'medium' },
    { q: 'Flour : Bread :: Grape : ?', a: ['Fruit','Vine','Wine','Purple'], correct: 2, diff: 'medium' },
    { q: 'Telescope : Stars :: Microscope : ?', a: ['Lab','Cells','Glass','Science'], correct: 1, diff: 'medium' },
    { q: 'Hammer : Nail :: Screwdriver : ?', a: ['Bolt','Wood','Screw','Tool'], correct: 2, diff: 'medium' },
    { q: 'Architect : Building :: Composer : ?', a: ['Piano','Music','Orchestra','Concert'], correct: 1, diff: 'medium' },
    { q: 'Rudder : Ship :: Steering wheel : ?', a: ['Road','Driver','Car','Tire'], correct: 2, diff: 'medium' },
    { q: 'Caterpillar : Butterfly :: Tadpole : ?', a: ['Fish','Frog','Toad','Salamander'], correct: 1, diff: 'medium' },
    { q: 'Palette : Painter :: Stage : ?', a: ['Curtain','Audience','Actor','Theater'], correct: 2, diff: 'hard' },
    { q: 'Scalpel : Surgeon :: Chisel : ?', a: ['Sculptor','Carpenter','Builder','Artist'], correct: 0, diff: 'hard' },
    { q: 'Elegy : Death :: Ode : ?', a: ['Celebration','Sadness','Poem','Song'], correct: 0, diff: 'hard' },
    { q: 'Retina : Eye :: Eardrum : ?', a: ['Sound','Ear','Head','Hearing'], correct: 1, diff: 'hard' },
    { q: 'Monarchy : King :: Democracy : ?', a: ['President','People','Vote','Government'], correct: 1, diff: 'hard' },
    { q: 'Canvas : Painting :: Marble : ?', a: ['Floor','Sculpture','Building','White'], correct: 1, diff: 'hard' },
    { q: 'Drought : Rain :: Famine : ?', a: ['Food','Water','Crops','Hunger'], correct: 0, diff: 'hard' },
    { q: 'Atom : Molecule :: Cell : ?', a: ['Body','Tissue','Organ','Blood'], correct: 1, diff: 'hard' },
    { q: 'Chrysalis : Butterfly :: Cocoon : ?', a: ['Moth','Caterpillar','Silk','Worm'], correct: 0, diff: 'hard' },
    { q: 'Sonnet : 14 :: Haiku : ?', a: ['3','5','7','17'], correct: 3, diff: 'hard' },
    { q: 'Arachnid : Spider :: Crustacean : ?', a: ['Ant','Crab','Snake','Scorpion'], correct: 1, diff: 'hard' },
    { q: 'Cartography : Maps :: Entomology : ?', a: ['Plants','Rocks','Insects','Stars'], correct: 2, diff: 'hard' },
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
    { q: 'Is "BOB" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "HAT" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "EYE" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "TOP" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "ABA" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "BIG" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "SIS" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "PEP" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "MAP" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "TOT" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Is "RUN" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 1, diff: 'easy' },
    { q: 'Is "DID" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'easy' },
    { q: 'Which is a palindrome?', a: ['KAYAK','CANOE','YACHT','FERRY'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['NEVER','CIVIC','MUSIC','DANCE'], correct: 1, diff: 'medium' },
    { q: 'Which number is a palindrome?', a: ['12345','54321','12321','13245'], correct: 2, diff: 'medium' },
    { q: 'Is "TOOT" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['APPLE','PEEP','GRAPE','LEMON'], correct: 1, diff: 'medium' },
    { q: 'Is "NOON" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Which is NOT a palindrome?', a: ['DEED','NOON','BOOK','PEEP'], correct: 2, diff: 'medium' },
    { q: 'Which number is a palindrome?', a: ['99899','98789','98799','99898'], correct: 0, diff: 'medium' },
    { q: 'Is "STATS" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['RIVER','LEVEL','WATER','OCEAN'], correct: 1, diff: 'medium' },
    { q: 'Is "REPAPER" a palindrome?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'medium' },
    { q: 'Which is a palindrome?', a: ['MIRROR','SOLOS','GLASS','WINDOW'], correct: 1, diff: 'medium' },
    { q: 'Is "Madam I\'m Adam" a palindrome (ignoring spaces/punctuation)?', a: ['Yes','No','Only partially','Depends'], correct: 0, diff: 'hard' },
    { q: 'Which is a palindrome?', a: ['DEIFIED','GLORIFIED','MODIFIED','VERIFIED'], correct: 0, diff: 'hard' },
    { q: 'Is "Step on no pets" a palindrome (ignoring spaces)?', a: ['Yes','No','Only partially','Depends'], correct: 0, diff: 'hard' },
    { q: 'Which is NOT a palindrome?', a: ['REVIVER','ROTATOR','TEACHER','REPAPER'], correct: 2, diff: 'hard' },
    { q: 'Is "Evil is a name of a foeman as I live" a palindrome?', a: ['Yes','No','Partially','Can\'t tell'], correct: 0, diff: 'hard' },
    { q: 'What is the shortest palindromic sentence?', a: ['I','A','Aa','It'], correct: 0, diff: 'hard' },
    { q: 'Is 10201 a palindromic number?', a: ['Yes','No','Sometimes','Depends'], correct: 0, diff: 'hard' },
    { q: 'Which is NOT a palindrome?', a: ['MALAYALAM','RACECAR','ELEPHANT','DEIFIED'], correct: 2, diff: 'hard' },
    { q: 'Is "Mr. Owl ate my metal worm" a palindrome (ignoring spaces)?', a: ['Yes','No','Partially','Depends'], correct: 0, diff: 'hard' },
    { q: 'Is "Able was I ere I saw Elba" a palindrome?', a: ['Yes','No','Only forwards','Depends'], correct: 0, diff: 'hard' },
    { q: 'Which is a palindrome?', a: ['DETARTRATED','COMPLICATED','DISTRIBUTED','IMPLEMENTED'], correct: 0, diff: 'hard' },
    { q: 'Is "tattarrattat" (James Joyce) a palindrome?', a: ['Yes','No','Partially','Not a word'], correct: 0, diff: 'hard' },
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
    { q: 'Odd one out: Dog, Cat, Fish, Desk', a: ['Dog','Cat','Fish','Desk'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Hat, Scarf, Gloves, Pizza', a: ['Hat','Scarf','Gloves','Pizza'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Banana, Orange, Grape, Pencil', a: ['Banana','Orange','Grape','Pencil'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Bed, Sofa, Table, Cloud', a: ['Bed','Sofa','Table','Cloud'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Airplane, Helicopter, Rocket, Bicycle', a: ['Airplane','Helicopter','Rocket','Bicycle'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Milk, Water, Juice, Rock', a: ['Milk','Water','Juice','Rock'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Drums, Guitar, Flute, Lamp', a: ['Drums','Guitar','Flute','Lamp'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Spring, Summer, Winter, Purple', a: ['Spring','Summer','Winter','Purple'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Eye, Nose, Ear, Shoe', a: ['Eye','Nose','Ear','Shoe'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Rose, Lily, Daisy, Hammer', a: ['Rose','Lily','Daisy','Hammer'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Earth, Venus, Mars, Moon', a: ['Earth','Venus','Mars','Moon'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Cup, Plate, Bowl, Shoe', a: ['Cup','Plate','Bowl','Shoe'], correct: 3, diff: 'easy' },
    { q: 'Odd one out: Penguin, Eagle, Ostrich, Trout', a: ['Penguin','Eagle','Ostrich','Trout'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Cello, Violin, Bass, Flute', a: ['Cello','Violin','Bass','Flute'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Spain, France, Germany, Africa', a: ['Spain','France','Germany','Africa'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Triangle, Square, Pentagon, Sphere', a: ['Triangle','Square','Pentagon','Sphere'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Copper, Gold, Silver, Wood', a: ['Copper','Gold','Silver','Wood'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Hydrogen, Oxygen, Nitrogen, Granite', a: ['Hydrogen','Oxygen','Nitrogen','Granite'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Democracy, Republic, Monarchy, Calculus', a: ['Democracy','Republic','Monarchy','Calculus'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Comma, Period, Colon, Verb', a: ['Comma','Period','Colon','Verb'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Newton, Einstein, Darwin, Beethoven', a: ['Newton','Einstein','Darwin','Beethoven'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: River, Lake, Pond, Desert', a: ['River','Lake','Pond','Desert'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Measles, Flu, Cold, Fracture', a: ['Measles','Flu','Cold','Fracture'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Addition, Subtraction, Multiplication, Hypothesis', a: ['Addition','Subtraction','Multiplication','Hypothesis'], correct: 3, diff: 'medium' },
    { q: 'Odd one out: Allegro, Adagio, Forte, Soprano', a: ['Allegro','Adagio','Forte','Soprano'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Igneous, Sedimentary, Metamorphic, Cumulus', a: ['Igneous','Sedimentary','Metamorphic','Cumulus'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Electron, Proton, Neutron, Molecule', a: ['Electron','Proton','Neutron','Molecule'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Iambic, Trochaic, Dactylic, Ironic', a: ['Iambic','Trochaic','Dactylic','Ironic'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Photosynthesis, Respiration, Fermentation, Reflection', a: ['Photosynthesis','Respiration','Fermentation','Reflection'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Impressionism, Surrealism, Cubism, Stoicism', a: ['Impressionism','Surrealism','Cubism','Stoicism'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Couplet, Tercet, Quatrain, Footnote', a: ['Couplet','Tercet','Quatrain','Footnote'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Fibonacci, Pascal, Euler, Shakespeare', a: ['Fibonacci','Pascal','Euler','Shakespeare'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Rhetoric, Dialectic, Logic, Arithmetic', a: ['Rhetoric','Dialectic','Logic','Arithmetic'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Sonata, Fugue, Concerto, Fresco', a: ['Sonata','Fugue','Concerto','Fresco'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Kinetic, Potential, Thermal, Optical', a: ['Kinetic','Potential','Thermal','Optical'], correct: 3, diff: 'hard' },
    { q: 'Odd one out: Pterodactyl, Triceratops, Velociraptor, Platypus', a: ['Pterodactyl','Triceratops','Velociraptor','Platypus'], correct: 3, diff: 'hard' },
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

/** Wrong answers that share the same last digit as the correct answer (offsets are multiples of 10). */
function makeWrongAnswersSameLastDigit(correct: number, count = 3): string[] {
  const wrongs = new Set<string>();
  const offsets = [10, -10, 20, -20, 30, -30];
  for (const off of offsets) {
    const val = correct + off;
    if (val > 0) wrongs.add(String(val));
  }
  wrongs.add(String(correct + randInt(1, 6) * 10));
  const neg = correct - randInt(1, 6) * 10;
  if (neg > 0) wrongs.add(String(neg));
  wrongs.delete(String(correct));
  // Remove non-positive values
  for (const w of wrongs) {
    if (Number(w) <= 0) wrongs.delete(w);
  }
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
  let sameLastDigit = false;

  if (diff === 'easy') {
    const op = pickOne(['+', '-', '×']);
    if (op === '+') {
      const a = randInt(1, 20), b = randInt(1, 20);
      q = `What is ${a} + ${b}?`; answer = a + b;
      sameLastDigit = true;
    } else if (op === '-') {
      const a = randInt(10, 30), b = randInt(1, a);
      q = `What is ${a} - ${b}?`; answer = a - b;
    } else {
      const a = randInt(2, 9), b = randInt(2, 9);
      q = `What is ${a} × ${b}?`; answer = a * b;
      sameLastDigit = true;
    }
  } else if (diff === 'medium') {
    const op = pickOne(['×', '÷', '+', '-']);
    if (op === '×') {
      const a = randInt(10, 25), b = randInt(2, 12);
      q = `What is ${a} × ${b}?`; answer = a * b;
      sameLastDigit = true;
    } else if (op === '÷') {
      const b = randInt(2, 12), ans = randInt(3, 20);
      const a = b * ans;
      q = `What is ${a} ÷ ${b}?`; answer = ans;
    } else if (op === '+') {
      const a = randInt(50, 200), b = randInt(30, 150);
      q = `What is ${a} + ${b}?`; answer = a + b;
      sameLastDigit = true;
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
      sameLastDigit = true;
    } else {
      const base = randInt(2, 5), exp = randInt(3, 5);
      q = `What is ${base}${exp === 3 ? '³' : exp === 4 ? '⁴' : '⁵'}?`;
      answer = Math.pow(base, exp);
    }
  }

  const wrongs = sameLastDigit
    ? makeWrongAnswersSameLastDigit(answer)
    : makeWrongAnswers(answer);
  const { a, correct } = shuffleAnswers(String(answer), wrongs);
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

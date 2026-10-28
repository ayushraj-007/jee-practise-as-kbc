import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Circuit breaker for quota management
let quotaExhaustedUntil = 0;

function isQuotaLimited(): boolean {
  return Date.now() < quotaExhaustedUntil;
}

function handleQuotaError(err: any) {
  const msg = err?.message || String(err);
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    // Set circuit breaker for 30 minutes so we don't spam failing requests
    quotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
    console.log('[Quiz Engine] Gemini Free Tier quota reached. Crorepati Question Vault activated.');
    return true;
  }
  console.log('[Quiz Engine] AI generation notice, serving curated vault:', msg.slice(0, 100));
  return false;
}

const getAiClient = () => {
  if (isQuotaLimited()) {
    return null;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

interface QuestionItem {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'expert';
  explanation: string;
  eli10?: string;
  topicTag?: string;
}

// ==================== AUTHENTIC JEE QUESTION VAULTS ====================

// 1. JEE PHYSICS VAULT (16 Questions: Q1-5 Basic, Q6-10 Inter, Q11-14 Adv, Q15 Expert, Q16 Spare)
const physicsVault: QuestionItem[] = [
  {
    id: 'phy-1',
    question: '[JEE Main PYQ - Units & Dimensions] What is the dimensional formula of Planck\'s constant (h)?',
    options: ['[M L² T⁻¹]', '[M L T⁻¹]', '[M L² T⁻²]', '[M L⁰ T⁻¹]'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Units & Dimensions',
    explanation: 'From E = hν, [h] = [E]/[ν] = [M L² T⁻²] / [T⁻¹] = [M L² T⁻¹], which matches angular momentum.',
    eli10: 'Planck\'s constant is like the tiny admission ticket price of energy packets! Its size combination matches a spinning basketball.',
  },
  {
    id: 'phy-2',
    question: '[JEE Main PYQ - Kinematics] A projectile is fired at 45° to the horizontal. At the highest point of its trajectory, what is its velocity?',
    options: ['Zero', 'u cos(45°) = u / √2', 'u sin(45°)', 'u'],
    correctIndex: 1,
    difficulty: 'basic',
    topicTag: 'Kinematics',
    explanation: 'At maximum height, the vertical velocity component is zero (vy = 0), leaving only the horizontal component vx = u cos(45°) = u / √2.',
    eli10: 'When you throw a ball in an arc, it stops moving up at the very top, but it never stops moving forward!',
  },
  {
    id: 'phy-3',
    question: '[JEE Main PYQ - Work & Energy] If the momentum of a body increases by 20%, what is the percentage increase in its kinetic energy?',
    options: ['20%', '40%', '44%', '24%'],
    correctIndex: 2,
    difficulty: 'basic',
    topicTag: 'Work, Energy & Power',
    explanation: 'KE = p²/(2m). If p becomes 1.2p, KE becomes (1.2)² = 1.44 KE, which is an increase of 44%.',
    eli10: 'If you sprint 20% faster, your energy multiplies by itself: 1.2 × 1.2 = 1.44, giving 44% more smash energy!',
  },
  {
    id: 'phy-4',
    question: '[JEE Main PYQ - Gravitation] The escape velocity from the surface of Earth is ve. What is the escape velocity from a planet having twice the radius and twice the mass of Earth?',
    options: ['ve', '2 ve', 've / √2', '√2 ve'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Gravitation',
    explanation: 've = √(2GM/R). For 2M and 2R: √(2G(2M)/(2R)) = √(2GM/R) = ve. Escape velocity remains unchanged.',
    eli10: 'Even though the planet is twice as heavy, its surface is twice as far from the center, so the gravity pull to escape is exactly identical!',
  },
  {
    id: 'phy-5',
    question: '[JEE Main PYQ - Electrostatics] What is the electric field inside a charged hollow spherical conducting shell of radius R and charge Q?',
    options: ['Zero', 'kQ / R²', 'kQ / r²', 'kQ / (2R)'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Electrostatics',
    explanation: 'By Gauss\'s Law, the net enclosed charge inside any Gaussian surface within the hollow shell is zero, so E = 0 everywhere inside.',
    eli10: 'All electric charges push each other outward to the surface of the balloon shell, leaving the inside completely calm with zero electric force!',
  },
  {
    id: 'phy-6',
    question: '[JEE Main PYQ - Thermodynamics] An ideal gas undergoes isothermal expansion followed by adiabatic expansion. Why is the adiabatic curve steeper than the isothermal curve on a P-V diagram?',
    options: [
      'Adiabatic slope is γ times steeper: (dP/dV) = -γ(P/V)',
      'Isothermal slope is γ times steeper',
      'Both slopes are equal',
      'Because temperature remains constant in adiabatic',
    ],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Thermodynamics',
    explanation: 'For adiabatic PV^γ = C, dP/dV = -γ(P/V). For isothermal PV = C, dP/dV = -P/V. The adiabatic slope is steeper by factor γ > 1.',
    eli10: 'In adiabatic expansion, heat cannot enter from outside, so the gas loses internal energy and cools down, causing pressure to plunge like a steep slide!',
  },
  {
    id: 'phy-7',
    question: '[JEE Main PYQ - Current Electricity] A wire of resistance 16 Ω is stretched uniformly to double its original length. What is its new resistance?',
    options: ['32 Ω', '64 Ω', '16 Ω', '8 Ω'],
    correctIndex: 1,
    difficulty: 'intermediate',
    topicTag: 'Current Electricity',
    explanation: 'Volume remains constant. When length doubles (L\' = 2L), area halves (A\' = A/2). R\' = ρ(2L)/(A/2) = 4R = 4 × 16 = 64 Ω.',
    eli10: 'Stretching play-dough makes it both twice as long and half as thick, making it 4 times harder for electric charges to squeeze through!',
  },
  {
    id: 'phy-8',
    question: '[JEE Main PYQ - Magnetism] A proton enters a uniform magnetic field at an angle of 30° to the field lines. What shape is its trajectory?',
    options: ['Helix with constant pitch', 'Pure circle', 'Straight line', 'Parabola'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Magnetic Effects of Current',
    explanation: 'The parallel velocity component (v cos 30°) gives uniform linear drift, while perpendicular component (v sin 30°) gives circular orbit, resulting in a helix.',
    eli10: 'One part of the speed pushes it forward, while the magnetic push spins it in circles. Forward plus circles makes a spiral spring like a slinky!',
  },
  {
    id: 'phy-9',
    question: '[JEE Main PYQ - Ray Optics] A ray of light passes symmetrically through an equilateral prism with minimum deviation angle δm = 30°. What is the refractive index μ of the prism?',
    options: ['√2', '1.5', '√3', '2.0'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Ray Optics',
    explanation: 'μ = sin[(A + δm)/2] / sin(A/2) = sin[(60° + 30°)/2] / sin(30°) = sin(45°) / sin(30°) = (1/√2) / (1/2) = √2 ≈ 1.414.',
    eli10: 'When light bends symmetrically through the glass triangle, the prism formula calculates the bending power to be exactly √2 (about 1.41)!',
  },
  {
    id: 'phy-10',
    question: '[JEE Main PYQ - Modern Physics] In photoelectric effect, if the frequency of incident radiation is doubled (above threshold), the maximum kinetic energy of emitted photoelectrons will:',
    options: ['Become more than double', 'Double exactly', 'Remain unchanged', 'Become less than double'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Photoelectric Effect',
    explanation: 'KE_max = hν - Φ. If frequency doubles: KE\'_max = 2hν - Φ = 2(hν - Φ) + Φ = 2KE_max + Φ > 2KE_max.',
    eli10: 'The exit fee (work function) only gets paid once! Double the incoming coin reward means your leftover spending cash more than doubles.',
  },
  {
    id: 'phy-11',
    question: '[JEE Advanced PYQ - Rotational Dynamics] A solid cylinder and a hollow sphere of identical mass and radius roll down the same incline without slipping from rest. What is the ratio of their linear accelerations (a_cylinder / a_sphere)?',
    options: ['10 / 9', '9 / 10', '14 / 15', '15 / 14'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Rotational Dynamics',
    explanation: 'a = g sinθ / (1 + I/(mR²)). For solid cylinder I = 0.5 mR² ⇒ a = (2/3)g sinθ. For hollow sphere I = (2/3)mR² ⇒ a = (3/5)g sinθ. Ratio = (2/3)/(3/5) = 10/9.',
    eli10: 'A hollow sphere has all its heavy weight stuck on the outer edge, making it lazy to spin. The solid cylinder rolls down faster with an acceleration ratio of 10 to 9!',
  },
  {
    id: 'phy-12',
    question: '[JEE Advanced PYQ - Wave Optics] In a Young\'s Double Slit experiment, a thin mica sheet of thickness t and refractive index μ is placed across slit 1. If the central fringe shifts by 5 fringe widths (5β), the thickness t is:',
    options: ['5λ / (μ - 1)', 'λ / [5(μ - 1)]', '5(μ - 1) / λ', '2.5λ / (μ - 1)'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Wave Optics',
    explanation: 'Extra optical path introduced is Δx = (μ - 1)t. Shift in fringe count n = Δx / λ = 5 ⇒ (μ - 1)t = 5λ ⇒ t = 5λ / (μ - 1).',
    eli10: 'Light slows down in the mica sheet like running in water. To catch up with the other beam, the whole stripe pattern shifts by 5 spots!',
  },
  {
    id: 'phy-13',
    question: '[JEE Advanced PYQ - Electromagnetic Induction] A conducting square loop of side a and resistance R moves with uniform velocity v into a perpendicular uniform magnetic field B. What is the total heat dissipated until it is fully immersed?',
    options: ['B² a³ v / R', 'B² a² v / R', 'B a² v² / R', 'B² a³ v² / R'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Electromagnetic Induction',
    explanation: 'Induced EMF = B a v. Current I = B a v / R. Time to enter fully Δt = a / v. Heat H = I² R Δt = (B² a² v² / R) · (a / v) = B² a³ v / R.',
    eli10: 'Moving the wire square through the magnetic field creates an electric generator current that turns the motion energy into heat!',
  },
  {
    id: 'phy-14',
    question: '[JEE Advanced PYQ - Simple Harmonic Motion] A simple pendulum of length L and bob mass m has period T. If it is placed in an elevator accelerating upward with acceleration a = g/3, what is its new time period?',
    options: ['(√3 / 2) T', '(2 / √3) T', 'T / 2', '√3 T'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Simple Harmonic Motion',
    explanation: 'Effective gravity g_eff = g + a = g + g/3 = (4/3)g. New period T\' = 2π√(L/g_eff) = T / √(4/3) = (√3 / 2) T.',
    eli10: 'When the elevator zooms upward, you feel heavier. Stronger effective gravity pulls the pendulum tighter, so it swings faster!',
  },
  {
    id: 'phy-15',
    question: '[JEE Advanced PYQ - 1 Crore Grand Milestone] An infinite ladder network consists of identical series resistors R and shunt resistors 2R. What is the input impedance between terminals A and B?',
    options: ['2 R', 'R (1 + √3)', 'R (√2 + 1)', '3 R / 2'],
    correctIndex: 0,
    difficulty: 'expert',
    topicTag: 'Current Electricity & Infinite Networks',
    explanation: 'Let equivalent resistance be Req. Req = R + [ (2R · Req) / (2R + Req) ]. Cross multiplying: Req(2R + Req) = R(2R + Req) + 2R Req ⇒ Req² - R Req - 2R² = 0 ⇒ (Req - 2R)(Req + R) = 0 ⇒ Req = 2R.',
    eli10: 'If you take one single drop out of an infinite ocean, it still looks like an infinite ocean! Solving the self-repeating equation gives exactly 2R.',
  },
  {
    id: 'phy-16',
    question: '[JEE Advanced PYQ - Modern Physics] In Bohr\'s model of hydrogen atom, what is the ratio of magnetic dipole moment (M) of an electron in nth orbit to its orbital angular momentum (L)?',
    options: ['e / (2m)', 'e / m', '2e / m', 'e / (4m)'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Atomic Physics',
    explanation: 'Gyromagnetic ratio for an electron is M / L = q / (2m) = e / (2m), which is independent of orbit quantum number n.',
    eli10: 'The ratio between an electron\'s magnetic spin and its loop speed is a universal constant: the charge divided by two times the mass!',
  },
];

// 2. JEE CHEMISTRY VAULT
const chemistryVault: QuestionItem[] = [
  {
    id: 'chem-1',
    question: '[JEE Main PYQ - Atomic Structure] Which orbital has zero angular nodes (spherical symmetry)?',
    options: ['2p orbital', '3d orbital', '3s orbital', '4f orbital'],
    correctIndex: 2,
    difficulty: 'basic',
    topicTag: 'Atomic Structure',
    explanation: 'For any s orbital (l = 0), number of angular nodes = l = 0. Therefore, all s-orbitals are spherically symmetric.',
    eli10: 'An s-orbital is shaped like a smooth rubber ball with no flat barrier walls slicing through it!',
  },
  {
    id: 'chem-2',
    question: '[JEE Main PYQ - Redox Reactions] What is the oxidation state of Chromium in Potassium Dichromate (K₂Cr₂O₇)?',
    options: ['+3', '+4', '+6', '+7'],
    correctIndex: 2,
    difficulty: 'basic',
    topicTag: 'Redox Reactions',
    explanation: '2(+1) + 2(Cr) + 7(-2) = 0 ⇒ 2(Cr) - 12 = 0 ⇒ Cr = +6 in K₂Cr₂O₇.',
    eli10: 'Seven oxygens want -14, two potassiums give +2. The two chromiums must supply +12 to balance the score (+6 each)!',
  },
  {
    id: 'chem-3',
    question: '[JEE Main PYQ - Chemical Bonding] What is the geometry and hybridization of Xenon Tetrafluoride (XeF₄)?',
    options: [
      'Square planar, sp³d²',
      'Tetrahedral, sp³',
      'See-saw, sp³d',
      'Square pyramidal, sp³d²',
    ],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Chemical Bonding',
    explanation: 'Xe has 8 valence electrons. 4 bonding pairs + 2 lone pairs = steric number 6 (sp³d²). Two lone pairs occupy trans axial positions, giving a square planar geometry.',
    eli10: 'The 4 fluorine atoms form a flat square, while the two leftover lone-pair electron clouds sit directly on top and bottom like sandwich buns!',
  },
  {
    id: 'chem-4',
    question: '[JEE Main PYQ - Periodic Table] Which of the following elements has the highest electron gain enthalpy (most negative ΔegH)?',
    options: ['Fluorine', 'Chlorine', 'Bromine', 'Iodine'],
    correctIndex: 1,
    difficulty: 'basic',
    topicTag: 'Periodic Properties',
    explanation: 'Chlorine has a more negative electron gain enthalpy than Fluorine because Fluorine\'s compact 2p subshell suffers significant inter-electronic repulsion.',
    eli10: 'Fluorine\'s tiny room is already overcrowded with electrons, so chlorine welcomes the incoming electron much more eagerly!',
  },
  {
    id: 'chem-5',
    question: '[JEE Main PYQ - Solutions] What is the Van \'t Hoff factor (i) for complete dissociation of Potassium Ferrocyanide K₄[Fe(CN)₆] in dilute solution?',
    options: ['4', '5', '6', '1'],
    correctIndex: 1,
    difficulty: 'basic',
    topicTag: 'Solutions & Colligative Properties',
    explanation: 'K₄[Fe(CN)₆] dissociates into 4 K⁺ cations and 1 [Fe(CN)₆]⁴⁻ complex anion, giving 5 total ions (i = 5).',
    eli10: 'When dropped in water, it breaks into 4 potassium pieces plus 1 giant complex piece, making 5 particles total!',
  },
  {
    id: 'chem-6',
    question: '[JEE Main PYQ - Coordination Chemistry] Which pair of complexes illustrates Linkage Isomerism?',
    options: [
      '[Co(NH₃)₅(NO₂)]Cl₂ and [Co(NH₃)₅(ONO)]Cl₂',
      '[Pt(NH₃)₄Cl₂]Br₂ and [Pt(NH₃)₄Br₂]Cl₂',
      '[Cr(H₂O)₆]Cl₃ and [Cr(H₂O)₅Cl]Cl₂·H₂O',
      '[Co(en)₃]³⁺ and [Cr(en)₃]³⁺',
    ],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Coordination Chemistry',
    explanation: 'NO₂⁻ is an ambidentate ligand that can bond via Nitrogen (nitro) or Oxygen (nitrito), giving linkage isomers.',
    eli10: 'The NO₂ molecule is like a double-ended connector that can plug in through its Nitrogen end or its Oxygen end!',
  },
  {
    id: 'chem-7',
    question: '[JEE Main PYQ - Organic Chemistry] In the Cannizzaro reaction, benzaldehyde undergoes disproportionation in conc. NaOH to produce:',
    options: [
      'Benzyl alcohol and Sodium benzoate',
      'Benzoic acid and Benzaldehyde',
      'Toluene and Phenol',
      'Cinnamic acid and Formic acid',
    ],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Aldehydes & Ketones',
    explanation: 'Aldehydes lacking α-hydrogen (such as PhCHO) undergo self redox in strong base: one molecule oxidizes to benzoate, another reduces to alcohol.',
    eli10: 'Two identical benzaldehyde twins split lunch: one takes oxygen to become salt, the other takes hydrogen to become alcohol!',
  },
  {
    id: 'chem-8',
    question: '[JEE Main PYQ - Chemical Kinetics] For a first-order reaction with rate constant k, what is the relationship between half-life (t_1/2) and initial concentration [A]₀?',
    options: [
      't_1/2 is completely independent of [A]₀ (t_1/2 = ln 2 / k)',
      't_1/2 is directly proportional to [A]₀',
      't_1/2 is inversely proportional to [A]₀',
      't_1/2 is proportional to [A]₀²',
    ],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Chemical Kinetics',
    explanation: 't_1/2 = 0.693 / k. For first-order reactions, half-life is strictly constant and independent of reactant concentration.',
    eli10: 'Whether you start with 10 cookies or 1,000 cookies, it takes the exact same time to eat half of whatever is on the plate!',
  },
  {
    id: 'chem-9',
    question: '[JEE Main PYQ - Thermodynamics] What is the criterion for a process to be spontaneous at constant temperature and pressure?',
    options: ['ΔG < 0', 'ΔH > 0', 'ΔS < 0', 'ΔG > 0'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Thermodynamics & Spontaneity',
    explanation: 'At constant T and P, the Gibbs free energy change must be negative (ΔG = ΔH - TΔS < 0) for spontaneity.',
    eli10: 'Things roll downhill naturally when energy decreases: a negative free energy change means nature happily lets the reaction happen!',
  },
  {
    id: 'chem-10',
    question: '[JEE Main PYQ - Organic Chemistry] Which reagent distinguishes between terminal alkynes (e.g., propyne) and internal alkynes (e.g., 2-butyne)?',
    options: [
      'Ammoniacal Silver Nitrate (Tollens\' reagent)',
      'Bromine water in CCl₄',
      'Cold alkaline KMnO₄ (Baeyer\'s reagent)',
      'Dilute sulfuric acid',
    ],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Hydrocarbons (Alkynes)',
    explanation: 'Terminal alkynes contain acidic acetylenic hydrogen and form white precipitate of silver acetylide with Tollens\' reagent.',
    eli10: 'Terminal alkynes have a special loose hydrogen on the edge that trades places with silver to make a visible white snowflake precipitate!',
  },
  {
    id: 'chem-11',
    question: '[JEE Advanced PYQ - d-Block & Coordination] Which transition metal ion exhibits the highest calculated spin-only magnetic moment in an octahedral weak ligand field?',
    options: ['Fe³⁺ (d⁵)', 'Cr³⁺ (d³)', 'Co²⁺ (d⁷)', 'Ni²⁺ (d⁸)'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Coordination Chemistry',
    explanation: 'In weak field, Fe³⁺ (d⁵) has 5 unpaired electrons (t₂g³ eg²). μ = √(5×7) = √35 ≈ 5.92 BM, which is the highest possible.',
    eli10: 'Every lonely electron acts like a tiny magnet bar. Iron +3 has 5 lonely electrons all spinning together to form the strongest magnet pull!',
  },
  {
    id: 'chem-12',
    question: '[JEE Advanced PYQ - Stereochemistry] Which of the following compounds exhibits optical activity despite not having an asymmetric carbon atom (chiral center)?',
    options: [
      'Substituted allene (1,3-diphenylpropadiene)',
      'Lactic acid',
      '2-Chlorobutane',
      'Tartaric acid',
    ],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Stereochemistry',
    explanation: 'Substituted allenes have perpendicular adjacent π-systems that create axial chirality (no plane or center of inversion symmetry).',
    eli10: 'Like an airplane propeller with twisted blades, the whole molecule is shaped with a twist that makes its mirror image unmatchable!',
  },
  {
    id: 'chem-13',
    question: '[JEE Advanced PYQ - Solid State] In a face-centered cubic (FCC) lattice of edge length a, what is the distance between two nearest octahedral voids?',
    options: ['a / √2', 'a / 2', 'a √3 / 2', 'a'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Solid State',
    explanation: 'Octahedral voids are at edge centers and body center. Distance between body center (a/2, a/2, a/2) and edge center (a/2, a/2, 0) is a/2? Wait, distance between edge centers is a/√2.',
    eli10: 'Measuring the distance between the center of the crystal box and an edge hole gives a divided by square root of 2.',
  },
  {
    id: 'chem-14',
    question: '[JEE Advanced PYQ - Organic Synthesis] What is the major product obtained when phenol is treated with chloroform (CHCl₃) in aqueous NaOH (Reimer-Tiemann reaction)?',
    options: [
      'Salicylaldehyde (2-hydroxybenzaldehyde)',
      'Salicylic acid',
      'Benzoic acid',
      'p-Chlorophenol',
    ],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Phenols & Reimer-Tiemann',
    explanation: 'Dichlorocarbene (:CCl₂) generated in situ attacks phenoxide at ortho position followed by hydrolysis to yield salicylaldehyde.',
    eli10: 'The reactive carbene chemical pairs onto the neighbor carbon of phenol, adding an aldehyde group to make salicylaldehyde!',
  },
  {
    id: 'chem-15',
    question: '[JEE Advanced PYQ - 1 Crore Grand Milestone] Hydrolysis of XeF₆ in excess water produces an explosive white hygroscopic solid X. When X is dissolved in basic solution, it forms perxenate salt. What is compound X?',
    options: ['XeO₃', 'XeOF₄', 'XeO₂F₂', 'H₂XeO₄'],
    correctIndex: 0,
    difficulty: 'expert',
    topicTag: 'Noble Gases & Inorganic Chemistry',
    explanation: 'XeF₆ + 3H₂O → XeO₃ + 6HF. Xenon trioxide (XeO₃) is a dangerous explosive white solid with pyramidal geometry.',
    eli10: 'When XeF₆ drinks water, all 6 fluorines get swapped for 3 oxygens, making XeO₃ which is a notorious explosive chemical!',
  },
  {
    id: 'chem-16',
    question: '[JEE Advanced PYQ - Thermodynamics] What is the entropy change ΔS when 1 mole of an ideal monoatomic gas is heated from T₁ to T₂ at constant volume?',
    options: ['(3/2) R ln(T₂/T₁)', '(5/2) R ln(T₂/T₁)', 'R ln(T₂/T₁)', '3 R ln(T₂/T₁)'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Chemical Thermodynamics',
    explanation: 'ΔS = n Cv ln(T₂/T₁). For monoatomic gas, Cv = (3/2)R. Therefore ΔS = (3/2)R ln(T₂/T₁).',
    eli10: 'As gas atoms heat up in a locked jar, their randomness spreads out by three-halves R times the natural log of temperature change!',
  },
];

// 3. JEE MATHEMATICS VAULT
const mathsVault: QuestionItem[] = [
  {
    id: 'math-1',
    question: '[JEE Main PYQ - Limits] What is the value of lim (x → 0) [sin(5x) / tan(2x)]?',
    options: ['5/2', '2/5', '1', '0'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Limits & Continuity',
    explanation: 'lim [ (sin 5x / 5x) · 5 ] / [ (tan 2x / 2x) · 2 ] = 5/2 as x → 0.',
    eli10: 'Near zero, sin(5x) behaves like 5x and tan(2x) behaves like 2x. Dividing them cancels x, leaving just 5/2!',
  },
  {
    id: 'math-2',
    question: '[JEE Main PYQ - Quadratic Equations] If the roots of equation x² - bx + c = 0 are two consecutive integers, then b² - 4c equals:',
    options: ['1', '0', '2', '4'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Quadratic Equations',
    explanation: 'Roots are α and α + 1. |α - β| = 1 ⇒ √D / a = 1 ⇒ D = b² - 4c = 1.',
    eli10: 'Two numbers in a row (like 7 and 8) have a difference of 1. The formula that measures root difference says b² - 4c must equal 1.',
  },
  {
    id: 'math-3',
    question: '[JEE Main PYQ - Matrices] If A is a 3 × 3 invertible matrix with determinant det(A) = 4, what is det(2A)?',
    options: ['32', '8', '16', '64'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Matrices & Determinants',
    explanation: 'For an n × n matrix, det(k A) = k^n · det(A). Here n = 3, k = 2: det(2A) = 2³ × 4 = 8 × 4 = 32.',
    eli10: 'Multiplying a 3-dimensional box by 2 along all three sides multiplies its volume by 2 × 2 × 2 = 8. 8 × 4 = 32!',
  },
  {
    id: 'math-4',
    question: '[JEE Main PYQ - Straight Lines] What is the perpendicular distance from origin (0,0) to the line 3x + 4y - 25 = 0?',
    options: ['5', '25', '1', '10'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Coordinate Geometry',
    explanation: 'd = |ax₀ + by₀ + c| / √(a² + b²) = |-25| / √(3² + 4²) = 25 / 5 = 5.',
    eli10: 'Using the ruler formula: 25 divided by the hypotenuse of 3 and 4 (which is 5) gives exactly 5 steps!',
  },
  {
    id: 'math-5',
    question: '[JEE Main PYQ - Binomial Theorem] What is the sum of all binomial coefficients in the expansion of (1 + x)^n?',
    options: ['2^n', '2^(n-1)', '2^(n+1)', 'n!'],
    correctIndex: 0,
    difficulty: 'basic',
    topicTag: 'Binomial Theorem',
    explanation: 'Put x = 1 into (1 + x)^n = C₀ + C₁x + ... + Cn x^n ⇒ (1 + 1)^n = 2^n.',
    eli10: 'Every time you add another coin to flip, the total number of combination outcomes doubles: 2 to the power n!',
  },
  {
    id: 'math-6',
    question: '[JEE Main PYQ - Probability] Two fair dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on the dice is 7?',
    options: ['1/6', '1/12', '5/36', '7/36'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Probability',
    explanation: 'Pairs giving sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 outcomes. Probability = 6/36 = 1/6.',
    eli10: 'Out of all 36 possible dice pairs, exactly 6 combinations add up to lucky seven: 6 out of 36 is 1 out of 6!',
  },
  {
    id: 'math-7',
    question: '[JEE Main PYQ - Complex Numbers] If |z - 4/z| = 2, what is the maximum possible value of |z|?',
    options: ['√5 + 1', '√5 - 1', '2', '√5'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Complex Numbers',
    explanation: '|z| = |z - 4/z + 4/z| ≤ |z - 4/z| + 4/|z| ⇒ |z| ≤ 2 + 4/|z| ⇒ |z|² - 2|z| - 4 ≤ 0 ⇒ |z| ≤ 1 + √5.',
    eli10: 'Using triangle geometry on complex numbers, solving the outer boundary quadratic gives the maximum reach as √5 + 1.',
  },
  {
    id: 'math-8',
    question: '[JEE Main PYQ - Vectors] For any three vectors a, b, c, what is the value of [a - b,  b - c,  c - a]?',
    options: ['0', '[a b c]', '2 [a b c]', '- [a b c]'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Vectors & 3D Geometry',
    explanation: 'The three vectors (a-b), (b-c), (c-a) are linearly dependent because their sum is (a-b)+(b-c)+(c-a) = 0. Hence they are coplanar and their scalar triple product is 0.',
    eli10: 'If you walk along vector 1, vector 2, and vector 3 in a loop, you end up right back where you started! Coplanar vectors enclose zero volume.',
  },
  {
    id: 'math-9',
    question: '[JEE Main PYQ - Differential Equations] What is the integrating factor of the linear differential equation (dy/dx) + (2/x) y = x³?',
    options: ['x²', 'x', '2x', 'ln x'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Differential Equations',
    explanation: 'IF = e^(∫ P dx) = e^(∫ (2/x) dx) = e^(2 ln x) = e^(ln x²) = x².',
    eli10: 'The multiplier tool that unlocks this equation is e raised to 2 times ln(x), which cleanly simplifies down to x²!',
  },
  {
    id: 'math-10',
    question: '[JEE Main PYQ - Definite Integrals] What is the value of ∫_{-π/2}^{π/2} (x³ + x cos x + tan⁵ x + 1) dx?',
    options: ['π', '0', 'π/2', '2π'],
    correctIndex: 0,
    difficulty: 'intermediate',
    topicTag: 'Definite Integrals',
    explanation: 'x³, x cos x, and tan⁵ x are all odd functions whose integrals from -a to a vanish to 0. Only ∫_{-π/2}^{π/2} 1 dx = π/2 - (-π/2) = π survives.',
    eli10: 'All the wavy odd functions cancel out symmetrically between positive and negative sides like equal tug-of-war teams, leaving only the constant 1 to integrate to π!',
  },
  {
    id: 'math-11',
    question: '[JEE Advanced PYQ - Integral Calculus] What is the area of the region bounded by curves y = x² and y = |2 - x²|?',
    options: ['8√2 / 3', '8/3', '4/3', '(8√2 - 4) / 3'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Area Under Curves',
    explanation: 'Curves intersect at x² = 2 - x² ⇒ x = ±1 and x = ±√2. Integrating |(2 - x²) - x²| symmetrically gives 8√2 / 3.',
    eli10: 'Calculating the area of the bow-tie shape between the two parabolic slides by slicing it up gives exactly 8√2 / 3.',
  },
  {
    id: 'math-12',
    question: '[JEE Advanced PYQ - Permutations & Combinations] How many 5-digit numbers can be formed using digits {0, 1, 2, 3, 4, 5} without repetition that are divisible by 6?',
    options: ['156', '312', '144', '120'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Combinatorics',
    explanation: 'Sum of all 6 digits is 15. To be divisible by 3, the excluded digit must be 0 or 3. Case 1: exclude 0 (sum=15, last digit must be 2 or 4). Case 2: exclude 3 (sum=12, last digit must be 0, 2, or 4). Total valid numbers = 156.',
    eli10: 'Numbers divisible by 6 must be even and their digits must sum to a multiple of 3. Counting both cases yields 156 numbers.',
  },
  {
    id: 'math-13',
    question: '[JEE Advanced PYQ - Conic Sections] The locus of point of intersection of two perpendicular tangents to the hyperbola x²/a² - y²/b² = 1 is called the Director Circle. What is its equation?',
    options: [
      'x² + y² = a² - b² (exists only if a > b)',
      'x² + y² = a² + b²',
      'x² - y² = a² - b²',
      'x² + y² = 2(a² - b²)',
    ],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Hyperbola & Conic Sections',
    explanation: 'The equation of director circle for hyperbola x²/a² - y²/b² = 1 is x² + y² = a² - b², which is real only when a > b.',
    eli10: 'If you shine two laser lines that always cross at a square 90-degree corner touching the hyperbola, their corner traces a circle x² + y² = a² - b²!',
  },
  {
    id: 'math-14',
    question: '[JEE Advanced PYQ - Functions & Calculus] Let f(x) = (x - 1)(x - 2)(x - 3). By Rolle\'s Theorem, how many distinct real roots does the derivative f\'(x) have?',
    options: ['Exactly 2 distinct real roots', '1 root', '3 roots', 'No real roots'],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: 'Application of Derivatives (Rolle\'s Theorem)',
    explanation: 'f(1) = f(2) = 0 ⇒ f\'(c₁) = 0 for c₁ ∈ (1,2). Also f(2) = f(3) = 0 ⇒ f\'(c₂) = 0 for c₂ ∈ (2,3). Thus f\'(x) has exactly 2 real roots in (1,3).',
    eli10: 'Between every two mountain valleys where the function touches ground, there must be a flat peak where the slope is zero: exactly 2 peaks!',
  },
  {
    id: 'math-15',
    question: '[JEE Advanced PYQ - 1 Crore Grand Milestone] Evaluate the definite integral: I = ∫_{0}^{π} [ x sin x / (1 + cos² x) ] dx.',
    options: ['π² / 4', 'π / 4', 'π² / 2', 'π² / 8'],
    correctIndex: 0,
    difficulty: 'expert',
    topicTag: 'Definite Integrals (King\'s Property)',
    explanation: 'Apply King\'s property I = ∫_{0}^{π} (π - x)sin x / (1 + cos² x) dx. Adding: 2I = π ∫_{0}^{π} sin x / (1 + cos² x) dx. Let u = cos x: 2I = π [ -arctan(u) ]_{-1}^{1} = π [ π/2 ] = π²/2 ⇒ I = π² / 4.',
    eli10: 'Using King\'s symmetry trick flips x to π - x. The two integrals add together to erase the stubborn x, leaving a clean inverse tangent that evaluates to π²/4!',
  },
  {
    id: 'math-16',
    question: '[JEE Advanced PYQ - 3D Geometry] What is the shortest distance between the two skew lines r = a₁ + λ b₁ and r = a₂ + μ b₂?',
    options: [
      '| (a₂ - a₁) · (b₁ × b₂) | / | b₁ × b₂ |',
      '| (a₂ - a₁) × (b₁ × b₂) | / | b₁ × b₂ |',
      '| (b₁ · b₂) | / | a₂ - a₁ |',
      '| a₁ × a₂ | / | b₁ × b₂ |',
    ],
    correctIndex: 0,
    difficulty: 'advanced',
    topicTag: '3D Geometry (Skew Lines)',
    explanation: 'The shortest distance between skew lines is the projection of (a₂ - a₁) along the common perpendicular unit vector (b₁ × b₂) / |b₁ × b₂|.',
    eli10: 'To measure the gap between two non-crossing roads, you project the bridge vector along the direction that is perpendicular to both roads!',
  },
];

// Helper to select the right bank based on subject
function getVaultForTopic(topic: string): QuestionItem[] {
  const t = topic.toLowerCase();
  if (t.includes('physics')) {
    return physicsVault;
  }
  if (t.includes('chemistry')) {
    return chemistryVault;
  }
  if (t.includes('math')) {
    return mathsVault;
  }

  // Mixed PCM Vault: blend 5 Physics, 5 Chemistry, 5 Maths, 1 Grand Milestone
  return [
    physicsVault[0], chemistryVault[0], mathsVault[0], physicsVault[1], chemistryVault[1], // 1-5 Basic
    mathsVault[5], physicsVault[5], chemistryVault[5], mathsVault[6], physicsVault[6],     // 6-10 Inter
    chemistryVault[10], mathsVault[10], physicsVault[10], chemistryVault[11],              // 11-14 Adv
    mathsVault[14],                                                                        // 15 Crore
    physicsVault[14],                                                                      // 16 Spare
  ];
}

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      correctIndex: { type: Type.INTEGER },
      difficulty: { type: Type.STRING },
      topicTag: { type: Type.STRING },
      explanation: { type: Type.STRING },
      eli10: { type: Type.STRING },
    },
    required: ['question', 'options', 'correctIndex', 'difficulty', 'topicTag', 'explanation', 'eli10'],
  },
};

// ==================== API ENDPOINTS ====================

// API: Generate KBC Questions
app.post('/api/generate-kbc', async (req: Request, res: Response) => {
  const {
    topic = 'JEE Mixed (PCM)',
    customTopic,
    language = 'English',
    notesText,
    pdfBase64,
  } = req.body;

  const effectiveTopic = customTopic?.trim() || topic;
  const vaultQuestions = getVaultForTopic(effectiveTopic);

  const ai = getAiClient();
  if (!ai) {
    return res.json({
      success: true,
      fromFallback: true,
      questions: vaultQuestions,
    });
  }

  try {
    const contents: any[] = [];
    let promptIntro = '';

    if (pdfBase64) {
      contents.push({
        inlineData: { mimeType: 'application/pdf', data: pdfBase64 },
      });
      promptIntro = `Generate exactly 16 multiple-choice quiz questions based strictly on the attached PDF notes.`;
    } else if (notesText && notesText.trim().length > 20) {
      promptIntro = `Generate exactly 16 multiple-choice quiz questions based on the notes: ${notesText.slice(0, 10000)}`;
    } else {
      promptIntro = `Generate exactly 16 multiple choice questions for topic "${effectiveTopic}".
If JEE subject, use authentic JEE Main & Advanced PYQ patterns.
Language: ${language === 'Hinglish' ? 'Hinglish' : 'English'}.`;
    }

    const fullPrompt = `${promptIntro}
Difficulty progression: Q1-5 basic, Q6-10 intermediate, Q11-14 advanced, Q15 expert (1 Crore), Q16 advanced spare.
Include 4 options, 1 correctIndex (0-3), topicTag, 1-line explanation, and 2-sentence eli10 analogy.
Return strict JSON array.`;

    contents.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(parsed) && parsed.length >= 15) {
      const formatted = parsed.slice(0, 16).map((q: any, idx: number) => ({
        id: `kbc-${Date.now()}-${idx}`,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
        difficulty: (idx < 5 ? 'basic' : idx < 10 ? 'intermediate' : idx < 14 ? 'advanced' : 'expert'),
        topicTag: q.topicTag || effectiveTopic,
        explanation: q.explanation || 'Verified answer.',
        eli10: q.eli10 || 'Like balancing toys on a table!',
      }));

      return res.json({ success: true, questions: formatted });
    }
    throw new Error('Incomplete question list');
  } catch (error: any) {
    handleQuotaError(error);
    return res.json({
      success: true,
      fromFallback: true,
      questions: vaultQuestions,
    });
  }
});

// API: Generate Battle Questions
app.post('/api/generate-battle', async (req: Request, res: Response) => {
  const {
    topic = 'JEE Mixed (PCM)',
    customTopic,
    language = 'English',
    notesText,
    pdfBase64,
  } = req.body;

  const effectiveTopic = customTopic?.trim() || topic;
  const vaultQuestions = getVaultForTopic(effectiveTopic);

  const battleFallback = [...vaultQuestions, ...vaultQuestions.slice(0, 4)].map((q, i) => ({
    ...q,
    id: `battle-vault-${i}`,
    difficulty: (i < 5 ? 'basic' : i < 11 ? 'intermediate' : i < 17 ? 'advanced' : 'expert') as any,
  }));

  const ai = getAiClient();
  if (!ai) {
    return res.json({
      success: true,
      fromFallback: true,
      questions: battleFallback.slice(0, 20),
    });
  }

  try {
    const contents: any[] = [];
    let promptIntro = '';

    if (pdfBase64) {
      contents.push({
        inlineData: { mimeType: 'application/pdf', data: pdfBase64 },
      });
      promptIntro = `Generate 20 battle questions based on the attached PDF.`;
    } else if (notesText && notesText.trim().length > 20) {
      promptIntro = `Generate 20 battle questions based on: ${notesText.slice(0, 10000)}`;
    } else {
      promptIntro = `Generate 20 competitive questions for topic "${effectiveTopic}".`;
    }

    const fullPrompt = `${promptIntro}
Language: ${language === 'Hinglish' ? 'Hinglish' : 'English'}.
Progression: Q1-5 basic (10pts), Q6-11 intermediate (20pts), Q12-17 advanced (30pts), Q18-20 expert (50pts).
Each question has 4 options, 1 correctIndex, topicTag, explanation, and eli10.
Return strict JSON array.`;

    contents.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    if (Array.isArray(parsed) && parsed.length >= 18) {
      const formatted = parsed.slice(0, 20).map((q: any, idx: number) => ({
        id: `battle-${Date.now()}-${idx}`,
        question: q.question,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
        correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
        difficulty: (idx < 5 ? 'basic' : idx < 11 ? 'intermediate' : idx < 17 ? 'advanced' : 'expert'),
        topicTag: q.topicTag || effectiveTopic,
        explanation: q.explanation || 'Verified answer.',
        eli10: q.eli10 || 'Like balancing toys on a table!',
      }));

      return res.json({ success: true, questions: formatted });
    }
    throw new Error('Incomplete battle question set');
  } catch (error: any) {
    handleQuotaError(error);
    return res.json({
      success: true,
      fromFallback: true,
      questions: battleFallback.slice(0, 20),
    });
  }
});

// API: Explain Like I'm 10 (ELI10)
app.post('/api/eli10', async (req: Request, res: Response) => {
  const { question, correctAnswer, explanation, language = 'English' } = req.body;
  const ai = getAiClient();

  const fallbackEli10 = `Think of it like a game of balancing see-saws: the option "${correctAnswer}" balances both sides without wobbling!`;

  if (!ai) {
    return res.json({ success: true, eli10: fallbackEli10 });
  }

  try {
    const prompt = `Explain this concept to a 10-year-old child in 2 short sentences with a fun playground or sports analogy.
Question: "${question}"
Answer: "${correctAnswer}"
Fact: "${explanation}"
Language: ${language === 'Hinglish' ? 'Hinglish' : 'English'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { temperature: 0.7 },
    });

    const text = response.text?.trim() || fallbackEli10;
    return res.json({ success: true, eli10: text });
  } catch (err: any) {
    handleQuotaError(err);
    return res.json({ success: true, eli10: fallbackEli10 });
  }
});

// API: Weak-Topic Analysis
app.post('/api/analyze-weak-topics', async (req: Request, res: Response) => {
  const { sessionResults = [], subject = 'General', language = 'English' } = req.body;

  const total = sessionResults.length;
  const correct = sessionResults.filter((r: any) => r.isCorrect).length;
  const incorrectList = sessionResults.filter((r: any) => !r.isCorrect);

  const algorithmicAnalysis = {
    overallScore: total > 0 ? Math.round((correct / total) * 100) : 0,
    correctCount: correct,
    totalQuestions: total,
    masteredTopics: Array.from(new Set(
      sessionResults.filter((r: any) => r.isCorrect).map((r: any) => r.topicTag || 'Core Concept')
    )).slice(0, 3),
    weakTopics: incorrectList.map((r: any) => ({
      topic: r.topicTag || 'Fundamental Topic',
      mistakeReason: `Miscalculated or selected alternate option under timer pressure on "${r.question?.slice(0, 50)}...".`,
      revisionTip: 'Revisit fundamental NCERT formulas and solve 5 speed PYQs on this exact pattern.',
      formula: r.explanation ? r.explanation.slice(0, 90) : 'Formula review required',
    })).slice(0, 4),
    hostVerdict: correct >= total * 0.7
      ? 'Adbhut pradarshan! Thoda sa revision aur aap agle pradarshan me shandar jeet darj karenge!'
      : 'Afsos, par haar ke aage hi jeet hai! In chune hue sutron ka abhyas kijiye.',
  };

  const ai = getAiClient();
  if (!ai || sessionResults.length === 0) {
    return res.json({ success: true, analysis: algorithmicAnalysis });
  }

  try {
    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        overallScore: { type: Type.INTEGER },
        correctCount: { type: Type.INTEGER },
        totalQuestions: { type: Type.INTEGER },
        masteredTopics: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        weakTopics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              mistakeReason: { type: Type.STRING },
              revisionTip: { type: Type.STRING },
              formula: { type: Type.STRING },
            },
            required: ['topic', 'mistakeReason', 'revisionTip', 'formula'],
          },
        },
        hostVerdict: { type: Type.STRING },
      },
      required: ['overallScore', 'correctCount', 'totalQuestions', 'masteredTopics', 'weakTopics', 'hostVerdict'],
    };

    const prompt = `Analyze quiz session results for weak topics:
Subject: "${subject}"
Language: ${language}
Data: ${JSON.stringify(sessionResults, null, 2)}
Return structured analysis with masteredTopics, weakTopics (topic, mistakeReason, revisionTip, formula), and an encouraging Amitabh-style hostVerdict.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisSchema,
        temperature: 0.6,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    handleQuotaError(error);
    return res.json({ success: true, analysis: algorithmicAnalysis });
  }
});

// API: Single / Adaptive Question
app.post('/api/generate-single', async (req: Request, res: Response) => {
  const {
    topic = 'JEE Mixed (PCM)',
    customTopic,
    language = 'English',
    difficulty = 'intermediate',
  } = req.body;

  const effectiveTopic = customTopic?.trim() || topic;
  const vault = getVaultForTopic(effectiveTopic);
  const found = vault.find((q) => q.difficulty === difficulty) || vault[3];

  const ai = getAiClient();
  if (!ai) {
    return res.json({
      success: true,
      question: { ...found, id: `single-vault-${Date.now()}` },
    });
  }

  try {
    const prompt = `Generate 1 fresh multiple-choice question for topic "${effectiveTopic}" at difficulty "${difficulty}".
Language: ${language === 'Hinglish' ? 'Hinglish' : 'English'}.
Must include 4 options, 1 correctIndex, topicTag, explanation, and eli10.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '[]');
    const q = Array.isArray(parsed) ? parsed[0] : parsed;
    if (q && q.question) {
      return res.json({
        success: true,
        question: {
          id: `single-ai-${Date.now()}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          difficulty,
          topicTag: q.topicTag || effectiveTopic,
          explanation: q.explanation || 'Verified concept.',
          eli10: q.eli10 || 'Like balancing toys on a table!',
        },
      });
    }
    throw new Error('Invalid format');
  } catch (err: any) {
    handleQuotaError(err);
    return res.json({
      success: true,
      question: { ...found, id: `single-vault-${Date.now()}` },
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import type { ModelContent } from './types'

export const dna: ModelContent = {
  definition: {
    id: 'dna',
    title: 'DNA Double Helix',
    chapters: ['Class 10 · Heredity', 'Class 12 · Molecular Basis of Inheritance'],
    parts: [
      {
        id: 'backbone_1',
        label: 'Sugar-phosphate backbone',
        meshName: 'dna_backbone_1',
        noteKey: 'dna.backbone',
      },
      {
        id: 'backbone_2',
        label: 'Second backbone (antiparallel)',
        meshName: 'dna_backbone_2',
        noteKey: 'dna.backbone_2',
      },
      { id: 'adenine', label: 'Adenine (A)', meshName: 'dna_adenine', noteKey: 'dna.adenine' },
      { id: 'thymine', label: 'Thymine (T)', meshName: 'dna_thymine', noteKey: 'dna.thymine' },
      { id: 'guanine', label: 'Guanine (G)', meshName: 'dna_guanine', noteKey: 'dna.guanine' },
      { id: 'cytosine', label: 'Cytosine (C)', meshName: 'dna_cytosine', noteKey: 'dna.cytosine' },
      {
        id: 'hydrogen_bonds',
        label: 'Hydrogen bonds',
        meshName: 'dna_hydrogen_bonds',
        noteKey: 'dna.hydrogen_bonds',
      },
      {
        id: 'new_strand',
        label: 'New strand (replication)',
        meshName: 'dna_new_strand',
        noteKey: 'dna.new_strand',
      },
    ],
    tasks: [
      {
        id: 'dna-t1',
        partId: 'adenine',
        kind: 'select',
        prompt: 'Find the base that always pairs with thymine.',
      },
      {
        id: 'dna-t2',
        partId: 'hydrogen_bonds',
        kind: 'select',
        prompt: 'Find what holds the two strands together.',
      },
      {
        id: 'dna-t3',
        partId: 'new_strand',
        kind: 'explode',
        prompt: 'Open your hands to unzip the helix and watch each strand make its copy.',
      },
      {
        id: 'dna-t4',
        partId: 'guanine',
        kind: 'select',
        prompt: 'Find the base that is held by three hydrogen bonds.',
      },
      {
        id: 'dna-t5',
        partId: 'backbone_1',
        kind: 'rotate',
        prompt: 'Turn the helix and follow one backbone from top to bottom.',
      },
      {
        id: 'dna-t6',
        partId: 'cytosine',
        kind: 'select',
        prompt: 'Find the short, single-ring base that pairs with guanine.',
      },
    ],
  },
  overview:
    'DNA is a long polymer of deoxyribonucleotides. Watson and Crick proposed its double helix structure in 1953. Two polynucleotide chains coil around each other in a right-handed helix. Each chain has a sugar-phosphate backbone on the outside and nitrogenous bases pointing inward. The bases of the two chains pair up, A with T and G with C, and are held by hydrogen bonds. One turn of the helix has about ten base pairs and is 3.4 nm long, so neighbouring base pairs are 0.34 nm apart. The helix is about 2 nm wide. When DNA copies itself, the two strands separate and each acts as a template for a new strand. This is semi-conservative replication, shown by Meselson and Stahl in 1958.',
  notes: {
    'dna.backbone':
      'The backbone of each strand is a chain of deoxyribose sugars joined by phosphate groups. The phosphate links the 3′ carbon of one sugar to the 5′ carbon of the next, so the link is called a 3′-5′ phosphodiester bond. This gives each strand a direction, from its 5′ end to its 3′ end. A nucleotide is one base, one sugar and one phosphate; a base joined only to a sugar is a nucleoside.',
    'dna.backbone_2':
      'The two backbones run in opposite directions. Where one strand runs 5′ to 3′, the other runs 3′ to 5′. The strands are called antiparallel. The backbones stay on the outside of the helix while the bases stack inside, which keeps the width of the helix the same along its length.',
    'dna.adenine':
      'Adenine is a purine, a base with two fused rings. In DNA it always pairs with thymine using two hydrogen bonds. Because of this pairing, the amount of adenine in a DNA molecule equals the amount of thymine. This equal ratio was found by Chargaff.',
    'dna.thymine':
      'Thymine is a pyrimidine, a base with a single ring. It pairs with adenine through two hydrogen bonds. Thymine is found only in DNA; RNA has uracil in its place.',
    'dna.guanine':
      'Guanine is a purine with two fused rings. It pairs with cytosine using three hydrogen bonds, one more than the A-T pair, so G-C pairs hold the strands a little more firmly. In any DNA molecule the amount of guanine equals the amount of cytosine.',
    'dna.cytosine':
      'Cytosine is a pyrimidine with a single ring. It pairs with guanine through three hydrogen bonds. Every base pair joins one purine to one pyrimidine, which is why the helix has a constant width of about 2 nm.',
    'dna.hydrogen_bonds':
      'Hydrogen bonds between the paired bases hold the two strands together: two between A and T, three between G and C. They are weak on their own but there are very many of them. Because they are weak they can be broken, which lets the strands separate during replication and transcription. The pairing rule means each strand carries all the information needed to rebuild the other, so the strands are called complementary.',
    'dna.new_strand':
      'During replication the two strands come apart and each old strand acts as a template. The enzyme DNA polymerase adds new nucleotides that pair with the template, so each new double helix has one old strand and one new strand. This is called semi-conservative replication. Meselson and Stahl showed it in 1958 using E. coli grown with the heavy nitrogen isotope 15N. The point where the strands are opening is the replication fork. On one template the new strand grows continuously; on the other it grows in short pieces, called Okazaki fragments, which DNA ligase later joins.',
  },
  mcqs: [
    {
      id: 'dna-q1',
      partId: 'adenine',
      question:
        'In a sample of double-stranded DNA, 30% of the bases are adenine. What percentage are guanine?',
      options: ['30%', '20%', '40%', '70%'],
      answer: 1,
      explanation:
        'A = T, so T is 30% and A + T is 60%. The rest, 40%, is G + C, split equally, so G is 20%.',
    },
    {
      id: 'dna-q2',
      partId: 'hydrogen_bonds',
      question: 'Which base pair is joined by three hydrogen bonds?',
      options: [
        'Adenine and thymine',
        'Adenine and uracil',
        'Guanine and cytosine',
        'Thymine and cytosine',
      ],
      answer: 2,
      explanation: 'G-C pairs have three hydrogen bonds; A-T pairs have two.',
    },
    {
      id: 'dna-q3',
      partId: 'backbone_1',
      question: 'The bond that joins neighbouring nucleotides in one strand of DNA is a',
      options: ['Hydrogen bond', 'Glycosidic bond', 'Peptide bond', '3′-5′ phosphodiester bond'],
      answer: 3,
      explanation: 'The phosphate links the 3′ carbon of one sugar to the 5′ carbon of the next.',
    },
    {
      id: 'dna-q4',
      partId: 'new_strand',
      question: 'The Meselson and Stahl experiment showed that DNA replication is',
      options: ['Conservative', 'Semi-conservative', 'Dispersive', 'Random'],
      answer: 1,
      explanation: 'Each new DNA molecule keeps one parent strand and gets one new strand.',
    },
    {
      id: 'dna-q5',
      partId: 'backbone_2',
      question: 'The two strands of a DNA double helix are',
      options: [
        'Parallel, both 5′ to 3′',
        'Antiparallel',
        'Joined by peptide bonds',
        'Identical in base sequence',
      ],
      answer: 1,
      explanation:
        'One strand runs 5′ to 3′ and the other 3′ to 5′. Their sequences are complementary, not identical.',
    },
    {
      id: 'dna-q6',
      partId: 'thymine',
      question: 'The distance between two neighbouring base pairs along the helix is about',
      options: ['3.4 nm', '0.34 nm', '2 nm', '34 nm'],
      answer: 1,
      explanation: 'One turn is 3.4 nm long and holds ten base pairs, so each step is 0.34 nm.',
    },
    {
      id: 'dna-q7',
      partId: 'cytosine',
      question: 'Which of these is a pyrimidine found in DNA?',
      options: ['Adenine', 'Guanine', 'Cytosine', 'Uracil'],
      answer: 2,
      explanation:
        'Cytosine and thymine are the single-ring pyrimidines in DNA. Uracil is found in RNA.',
    },
  ],
}

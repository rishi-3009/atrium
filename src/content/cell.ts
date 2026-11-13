import type { ModelContent } from './types'

export const cell: ModelContent = {
  definition: {
    id: 'cell',
    title: 'Animal Cell',
    chapters: ['Class 11 · Cell: The Unit of Life'],
    parts: [
      { id: 'membrane', label: 'Cell membrane', meshName: 'cell_membrane', noteKey: 'cell.membrane' },
      { id: 'nucleus', label: 'Nucleus', meshName: 'cell_nucleus', noteKey: 'cell.nucleus' },
      { id: 'nucleolus', label: 'Nucleolus', meshName: 'cell_nucleolus', noteKey: 'cell.nucleolus' },
      { id: 'mitochondria', label: 'Mitochondria', meshName: 'cell_mitochondria', noteKey: 'cell.mitochondria' },
      { id: 'rough_er', label: 'Rough endoplasmic reticulum', meshName: 'cell_rough_er', noteKey: 'cell.rough_er' },
      { id: 'smooth_er', label: 'Smooth endoplasmic reticulum', meshName: 'cell_smooth_er', noteKey: 'cell.smooth_er' },
      { id: 'golgi', label: 'Golgi apparatus', meshName: 'cell_golgi', noteKey: 'cell.golgi' },
      { id: 'lysosomes', label: 'Lysosomes', meshName: 'cell_lysosomes', noteKey: 'cell.lysosomes' },
      { id: 'centrosome', label: 'Centrosome', meshName: 'cell_centrosome', noteKey: 'cell.centrosome' },
      { id: 'ribosomes', label: 'Ribosomes', meshName: 'cell_ribosomes', noteKey: 'cell.ribosomes' },
    ],
    tasks: [
      { id: 'cell-t1', partId: 'nucleus', kind: 'select', prompt: 'Find the organelle that holds the cell’s DNA.' },
      { id: 'cell-t2', partId: 'mitochondria', kind: 'pull', prompt: 'Pull out the organelle that makes most of the cell’s ATP.' },
      { id: 'cell-t3', partId: 'nucleolus', kind: 'select', prompt: 'Look inside the nucleus and find the dense spot that makes rRNA.' },
      { id: 'cell-t4', partId: 'rough_er', kind: 'pull', prompt: 'Pull out the endoplasmic reticulum that has ribosomes on it.' },
      { id: 'cell-t5', partId: 'golgi', kind: 'select', prompt: 'Find the stack of flat sacs that packs and sends out proteins.' },
      { id: 'cell-t6', partId: 'centrosome', kind: 'rotate', prompt: 'Turn the cell and find the two centrioles that lie at right angles.' },
      { id: 'cell-t7', partId: 'lysosomes', kind: 'explode', prompt: 'Open your hands wide to pull the cell apart and find the lysosomes.' },
    ],
  },
  overview:
    'The cell is the basic unit of life. This animal cell is cut open at the front. It has no cell wall. Its outer boundary is the cell membrane, and inside the cytoplasm sit the nucleus and the organelles, each with its own job. The endoplasmic reticulum, Golgi apparatus and lysosomes work together as the endomembrane system.',
  notes: {
    'cell.membrane':
      'The cell membrane is the outer boundary of an animal cell. It is made of a double layer of lipids with proteins floating in it. The fluid mosaic model of Singer and Nicolson (1972) describes this structure. The membrane is selectively permeable, so it controls which substances move in and out of the cell.',
    'cell.nucleus':
      'The nucleus was described by Robert Brown. It is covered by a double membrane called the nuclear envelope, which has pores for the exchange of materials with the cytoplasm. Inside is the nucleoplasm, which holds the nucleolus and the chromatin. Chromatin is made of DNA and proteins, and it condenses into chromosomes when the cell divides.',
    'cell.nucleolus':
      'The nucleolus is a dense, round structure inside the nucleus. It is not enclosed by a membrane. It is the site of active ribosomal RNA (rRNA) synthesis.',
    'cell.mitochondria':
      'Mitochondria are called the powerhouses of the cell because they make most of its ATP. Each has two membranes. The outer one is smooth and the inner one is folded into cristae, which increase the surface area for the reactions that make ATP. The space inside is the matrix. Mitochondria have their own circular DNA and 70S ribosomes, and they divide by fission.',
    'cell.rough_er':
      'The rough endoplasmic reticulum (RER) has ribosomes attached to its outer surface. It is a network of flattened sacs called cisternae. The RER takes part in the making and transport of proteins, including those that leave the cell.',
    'cell.smooth_er':
      'The smooth endoplasmic reticulum (SER) has no ribosomes on it. It is the main site for making lipids. In animal cells, steroid hormones are made in the SER.',
    'cell.golgi':
      'The Golgi apparatus was first seen by Camillo Golgi. It is a stack of flat, disc-shaped sacs called cisternae, usually near the nucleus. The side that receives material is the cis (forming) face and the side that sends it out is the trans (maturing) face. It packages materials for delivery to other parts of the cell or outside it, and it is where glycoproteins and glycolipids are formed.',
    'cell.lysosomes':
      'Lysosomes are small bags enclosed by a membrane. They are formed by packaging in the Golgi apparatus. They contain hydrolytic enzymes such as lipases, proteases and carbohydrases, which work best in acidic conditions. These enzymes can digest carbohydrates, proteins, lipids and nucleic acids.',
    'cell.centrosome':
      'The centrosome has two cylindrical structures called centrioles, which lie at right angles to each other, surrounded by a cloud of material. Each centriole has nine evenly spaced fibrils made of the protein tubulin, and each fibril is a triplet. A central hub joined to the fibrils by spokes gives it a cartwheel shape. Centrioles form the basal body of cilia and flagella and help to form the spindle during animal cell division.',
    'cell.ribosomes':
      'Ribosomes were first seen by George Palade (1953). They are made of RNA and proteins and are not surrounded by a membrane. They are the sites of protein synthesis. Eukaryotic ribosomes are 80S, made of a 60S and a 40S subunit. They lie free in the cytoplasm or attached to the rough ER.',
  },
  mcqs: [
    {
      id: 'cell-q1',
      partId: 'membrane',
      question: 'The fluid mosaic model of the cell membrane was proposed by',
      options: ['Robert Brown', 'Singer and Nicolson', 'Camillo Golgi', 'George Palade'],
      answer: 1,
      explanation: 'Singer and Nicolson proposed it in 1972: proteins float in a fluid lipid bilayer.',
    },
    {
      id: 'cell-q2',
      partId: 'mitochondria',
      question: 'The infoldings of the inner mitochondrial membrane are called',
      options: ['Grana', 'Cristae', 'Cisternae', 'Thylakoids'],
      answer: 1,
      explanation: 'Cristae increase the surface area of the inner membrane for ATP production.',
    },
    {
      id: 'cell-q3',
      partId: 'nucleolus',
      question: 'Which structure is the site of active rRNA synthesis?',
      options: ['Golgi apparatus', 'Lysosome', 'Nucleolus', 'Centriole'],
      answer: 2,
      explanation: 'The nucleolus is a membrane-less region inside the nucleus where rRNA is made.',
    },
    {
      id: 'cell-q4',
      partId: 'rough_er',
      question: 'Ribosomes are found attached to the surface of the',
      options: ['Smooth ER', 'Rough ER', 'Golgi apparatus', 'Lysosome'],
      answer: 1,
      explanation: 'Ribosomes on its surface give the rough ER its name.',
    },
    {
      id: 'cell-q5',
      partId: 'smooth_er',
      question: 'Lipids and steroid hormones are mainly made in the',
      options: ['Rough ER', 'Smooth ER', 'Nucleolus', 'Ribosomes'],
      answer: 1,
      explanation: 'The smooth ER has no ribosomes and is the main site of lipid synthesis.',
    },
    {
      id: 'cell-q6',
      partId: 'lysosomes',
      question: 'The enzymes inside lysosomes work best at',
      options: ['Acidic pH', 'Neutral pH', 'Basic pH', 'Any pH equally'],
      answer: 0,
      explanation: 'Lysosomal hydrolytic enzymes are most active in acidic conditions.',
    },
    {
      id: 'cell-q7',
      partId: 'golgi',
      question: 'Which organelle packages and sends out materials, and forms glycoproteins and glycolipids?',
      options: ['Mitochondria', 'Ribosome', 'Golgi apparatus', 'Nucleus'],
      answer: 2,
      explanation: 'The Golgi apparatus modifies, packages and dispatches cell products.',
    },
    {
      id: 'cell-q8',
      partId: 'centrosome',
      question: 'Each centriole is made of',
      options: [
        'Nine triplets of tubulin fibrils',
        'Nine doublets with a central pair',
        'Twelve single fibrils',
        'Two rings of nine doublets',
      ],
      answer: 0,
      explanation: 'A centriole has nine peripheral triplets. The nine doublets plus a central pair pattern belongs to cilia and flagella.',
    },
    {
      id: 'cell-q9',
      partId: 'ribosomes',
      question: 'Ribosomes of eukaryotic cells have a sedimentation coefficient of',
      options: ['50S', '60S', '70S', '80S'],
      answer: 3,
      explanation: 'Eukaryotic ribosomes are 80S, made of 60S and 40S subunits.',
    },
    {
      id: 'cell-q10',
      partId: 'mitochondria',
      question: 'Which organelle has its own circular DNA and 70S ribosomes?',
      options: ['Golgi apparatus', 'Lysosome', 'Mitochondria', 'Rough ER'],
      answer: 2,
      explanation: 'Mitochondria carry their own DNA and 70S ribosomes, and they divide by fission.',
    },
    {
      id: 'cell-q11',
      partId: 'nucleus',
      question: 'The nuclear envelope has pores. What are they for?',
      options: [
        'Making ATP',
        'Exchange of materials between the nucleus and the cytoplasm',
        'Digesting waste',
        'Attaching the spindle',
      ],
      answer: 1,
      explanation: 'Pores in the double-layered nuclear envelope let materials move between the nucleus and the cytoplasm.',
    },
  ],
}

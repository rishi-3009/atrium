import type { ModelContent } from './types'

export const flower: ModelContent = {
  definition: {
    id: 'flower',
    title: 'Flower',
    chapters: [
      'Class 10 · How do Organisms Reproduce?',
      'Class 11 · Morphology of Flowering Plants',
      'Class 12 · Sexual Reproduction in Flowering Plants',
    ],
    parts: [
      { id: 'pedicel', label: 'Pedicel', meshName: 'flower_pedicel', noteKey: 'flower.pedicel' },
      { id: 'thalamus', label: 'Thalamus', meshName: 'flower_thalamus', noteKey: 'flower.thalamus' },
      { id: 'sepals', label: 'Sepals (calyx)', meshName: 'flower_sepals', noteKey: 'flower.sepals' },
      { id: 'petals', label: 'Petals (corolla)', meshName: 'flower_petals', noteKey: 'flower.petals' },
      { id: 'stamens', label: 'Stamens (androecium)', meshName: 'flower_stamens', noteKey: 'flower.stamens' },
      { id: 'stigma', label: 'Stigma', meshName: 'flower_stigma', noteKey: 'flower.stigma' },
      { id: 'style', label: 'Style', meshName: 'flower_style', noteKey: 'flower.style' },
      { id: 'ovary', label: 'Ovary', meshName: 'flower_ovary', noteKey: 'flower.ovary' },
      { id: 'ovules', label: 'Ovules', meshName: 'flower_ovules', noteKey: 'flower.ovules' },
    ],
    tasks: [
      { id: 'flower-t1', partId: 'stigma', kind: 'select', prompt: 'Find the part of the carpel that receives pollen.' },
      { id: 'flower-t2', partId: 'stamens', kind: 'pull', prompt: 'Pull out the male reproductive whorl of the flower.' },
      { id: 'flower-t3', partId: 'sepals', kind: 'pull', prompt: 'Pull out the green whorl that protects the flower in bud.' },
      { id: 'flower-t4', partId: 'ovary', kind: 'select', prompt: 'Find the swollen base of the carpel that becomes the fruit.' },
      { id: 'flower-t5', partId: 'ovules', kind: 'select', prompt: 'Look inside the ovary and find the ovules.' },
      { id: 'flower-t6', partId: 'petals', kind: 'rotate', prompt: 'Turn the flower and look at its bright petals from every side.' },
      { id: 'flower-t7', partId: 'thalamus', kind: 'explode', prompt: 'Open your hands wide to pull the flower apart, whorl by whorl.' },
    ],
  },
  overview:
    'A flower is the reproductive part of a flowering plant. It grows on a stalk called the pedicel, and the swollen tip of the stalk, the thalamus, carries four whorls: the calyx (sepals), the corolla (petals), the androecium (stamens) and the gynoecium (carpels). The stamens are the male parts and the carpels are the female parts.',
  notes: {
    'flower.pedicel':
      'The pedicel is the stalk of the flower. It holds the flower and joins it to the stem. A flower that has no pedicel is called sessile.',
    'flower.thalamus':
      'The thalamus, also called the receptacle, is the swollen end of the pedicel. The four floral whorls are arranged on it: calyx, corolla, androecium and gynoecium.',
    'flower.sepals':
      'The sepals together form the calyx, the outermost whorl. They are usually green and leaf-like. They protect the flower when it is still a bud.',
    'flower.petals':
      'The petals together form the corolla. They are usually brightly coloured, which attracts insects for pollination.',
    'flower.stamens':
      'The stamens together form the androecium, the male reproductive part. Each stamen has a long, thin filament and an anther at its tip. The anther is usually bilobed, and each lobe has two chambers called pollen sacs, where pollen grains are made.',
    'flower.stigma':
      'The stigma is the tip of the carpel. It is the surface on which pollen grains land and are held. It sits at the top of the style.',
    'flower.style':
      'The style is the long, thin tube that joins the stigma to the ovary. It lifts the stigma up so that it can receive pollen.',
    'flower.ovary':
      'The ovary is the swollen, basal part of the carpel. It contains one or more ovules. After fertilisation the ovary grows into the fruit.',
    'flower.ovules':
      'Ovules lie inside the ovary, attached to a cushion-like tissue called the placenta. After fertilisation each ovule develops into a seed.',
  },
  mcqs: [
    {
      id: 'flower-q1',
      partId: 'sepals',
      question: 'Which floral whorl protects the flower in the bud stage?',
      options: ['Corolla', 'Calyx', 'Androecium', 'Gynoecium'],
      answer: 1,
      explanation: 'The calyx is made of sepals. They enclose and protect the bud.',
    },
    {
      id: 'flower-q2',
      partId: 'stamens',
      question: 'The male reproductive whorl of a flower is the',
      options: ['Calyx', 'Corolla', 'Androecium', 'Gynoecium'],
      answer: 2,
      explanation: 'The androecium is the whorl of stamens, which make pollen.',
    },
    {
      id: 'flower-q3',
      partId: 'stigma',
      question: 'On which part of the carpel do pollen grains land?',
      options: ['Ovary', 'Style', 'Stigma', 'Placenta'],
      answer: 2,
      explanation: 'The stigma is the receptive tip of the carpel.',
    },
    {
      id: 'flower-q4',
      partId: 'ovary',
      question: 'After fertilisation, the ovary develops into a',
      options: ['Seed', 'Fruit', 'Embryo', 'Pollen sac'],
      answer: 1,
      explanation: 'The ovary becomes the fruit and the ovules inside it become seeds.',
    },
    {
      id: 'flower-q5',
      partId: 'ovules',
      question: 'After fertilisation, ovules develop into',
      options: ['Fruits', 'Seeds', 'Anthers', 'Petals'],
      answer: 1,
      explanation: 'Each fertilised ovule becomes a seed.',
    },
    {
      id: 'flower-q6',
      partId: 'pedicel',
      question: 'A flower without a pedicel is called',
      options: ['Sessile', 'Bracteate', 'Pedunculate', 'Complete'],
      answer: 0,
      explanation: 'Sessile means attached directly, without a stalk.',
    },
    {
      id: 'flower-q7',
      partId: 'stamens',
      question: 'A stamen is made of',
      options: ['Stigma and style', 'Filament and anther', 'Ovary and ovule', 'Sepal and petal'],
      answer: 1,
      explanation: 'The filament holds up the anther, and the anther makes the pollen.',
    },
    {
      id: 'flower-q8',
      partId: 'petals',
      question: 'The bright colour of petals mainly helps in',
      options: ['Making food', 'Attracting insects for pollination', 'Absorbing water', 'Protecting the bud'],
      answer: 1,
      explanation: 'Bright petals attract insects, which carry pollen between flowers.',
    },
    {
      id: 'flower-q9',
      partId: 'style',
      question: 'The part of the carpel that joins the stigma to the ovary is the',
      options: ['Filament', 'Style', 'Placenta', 'Thalamus'],
      answer: 1,
      explanation: 'The style is the tube between the stigma and the ovary.',
    },
    {
      id: 'flower-q10',
      partId: 'thalamus',
      question: 'The swollen end of the pedicel on which floral whorls are arranged is the',
      options: ['Anther', 'Thalamus', 'Placenta', 'Style'],
      answer: 1,
      explanation: 'The thalamus, or receptacle, carries all four whorls.',
    },
  ],
}

import { uid } from './storage.js'

export function createSeedState() {
  const l1 = uid('lesson')
  const l2 = uid('lesson')
  const l3 = uid('lesson')
  const l4 = uid('lesson')
  const s1 = uid('student')

  const lessons = [
    {
      id: l1,
      title: 'Числа и вычисления',
      block: 'Алгебра',
      grade: '7 класс',
      order: 1,
      tags: ['база'],
      markdown: `# Числа и вычисления

Рациональные числа записываются в виде $\\dfrac{a}{b}$, где $b \\neq 0$.

## Основные свойства

$$\\frac{a}{b} + \\frac{c}{d} = \\frac{ad + bc}{bd}$$

При умножении дробей перемножаются числители и знаменатели:

$$\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}$$

### Задача на закрепление

Найдите значение выражения:

$$\\frac{3}{4} + \\frac{5}{6} = \\;?$$

> Подсказка: приведите к общему знаменателю $12$.
`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: l2,
      title: 'Квадратные уравнения',
      block: 'Алгебра',
      grade: '9 класс',
      order: 2,
      tags: ['экзамен'],
      markdown: `# Квадратные уравнения

Уравнение вида $ax^2 + bx + c = 0$, $a \\neq 0$.

## Дискриминант

$$D = b^2 - 4ac$$

- $D > 0$ — два корня: $x_{1,2} = \\dfrac{-b \\pm \\sqrt{D}}{2a}$
- $D = 0$ — один корень: $x = -\\dfrac{b}{2a}$
- $D < 0$ — корней нет (в действительных числах)

## Пример

Решим $x^2 - 5x + 6 = 0$: $D = 25 - 24 = 1$, поэтому

$$x_1 = 3, \\quad x_2 = 2$$
`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: l3,
      title: 'Планиметрия: треугольники',
      block: 'Геометрия',
      grade: '8 класс',
      order: 3,
      tags: ['теоремы'],
      markdown: `# Треугольники

## Теорема Пифагора

Для прямоугольного треугольника со сторонами $a$, $b$ и гипотенузой $c$:

$$a^2 + b^2 = c^2$$

## Теорема косинусов

$$c^2 = a^2 + b^2 - 2ab\\cos\\gamma$$

При $\\gamma = 90^\\circ$ получаем теорему Пифагора, так как $\\cos 90^\\circ = 0$.
`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: l4,
      title: 'Функции и графики',
      block: 'Алгебра',
      grade: '10 класс',
      order: 4,
      tags: [],
      markdown: `# Линейная функция

$$y = kx + b$$

- $k$ — угловой коэффициент (наклон прямой),
- $b$ — точка пересечения с осью $y$.

При $k > 0$ функция возрастает, при $k < 0$ — убывает.
`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ]

  const students = [
    {
      id: s1,
      name: 'Алексей Иванов',
      grade: '9 класс',
      contacts: '+7 900 000-00-00',
      goal: 'Подготовка к ОГЭ, цель — 4+',
      createdAt: Date.now(),
    },
  ]

  const progress = {
    [s1]: {
      [l1]: { status: 'done', note: '' },
      [l2]: { status: 'in_progress', note: 'Разобрали дискриминант, нужна практика' },
    },
  }

  return {
    version: 1,
    lessons,
    students,
    progress,
    sessions: [],
  }
}

const {times, equals, take} = require('ramda')
const {Readable, Transform} = require('stream')

function automataStream(firstGeneration, rules) {
  let currentGeneration = firstGeneration

  return new Readable({
    objectMode: true,

    read() {
      this.push(currentGeneration)

      currentGeneration = nextGeneration(currentGeneration, rules)
    }
  })
}

function automataMutationStream(chance) {
  return new Transform({
    objectMode: true,
    transform(generation, _, next) {
      this.push(mutatedGeneration(generation, chance))

      next()
    }
  })
}

function mutatedGeneration(generation, chance) {
  return generation.map(v => chance() ? !v  : v)
}

function automataStringStream() {
  return new Transform({
    writableObjectMode: true,
    transform(value, _, next) {
      this.push(value.map(atomChar).join('') + '\n')
      next()
    }
  })
}

function atomChar(v) {
  return v ? '█' : ' '
}

function randomGeneration(randFn, width) {
  return times(() => randFn() <= 0.5, width)
}

function nextGeneration(previous, rules) {
  const width = previous.length

  return times(index => {
    const pattern = takeRange(index - 1, index + 2, previous)
    const rule = findRule(rules, pattern)

    return ruleResult(rule)
  }, previous.length)
}

function ruleResult(rule) {
  return rule[3]
}

function findRule(rules, pattern) {
  return rules.find(rulePattern => {
    return equals(pattern.map(v => Number(v || 0)), take(3, rulePattern))
  })
}

function takeRange(startIndex, endIndex, array) {
  return times(index => {
    index = startIndex + index
    index = index < 0 ? 0 : index

    return array[index]
  }, endIndex - startIndex)
}

const rules = {
  30: [
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 1, 1, 1],
  ],
  75: [
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 1, 1, 0],
  ]
}

automataStream(randomGeneration(Math.random, 128), rules[75])
  .pipe(automataMutationStream(() => Math.random() < 0.01))
  .pipe(automataStringStream())
  .pipe(process.stdout)

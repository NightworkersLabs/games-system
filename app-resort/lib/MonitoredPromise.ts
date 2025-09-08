import { SingleExecPromise } from './SingleExecPromise'

//
export const delay = (ms: number) => new Promise(resolve => setInterval(resolve, ms))

//
export interface IMonitoredPromise {
  name: string
  promiser: SingleExecPromise | (() => Promise<void>)
}

//
export const execM = async ({ name, promiser }: IMonitoredPromise) => {
  //
  const before = Date.now()

  //
  if (promiser instanceof SingleExecPromise) {
    await promiser.raiseAndWait()
  } else {
    await promiser()
  }

  const doneIn = (Date.now() - before) / 1000

  //
  console.log(`[${name}] done in ${doneIn}s`)
}

export const mergeMapDoAll = (rules: IMonitoredPromise[], doThen: () => void) => Promise.all(
  rules.map(a =>
    execM(a)
      .then(doThen)
  )
)

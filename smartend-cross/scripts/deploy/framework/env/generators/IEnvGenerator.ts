import { NightworkersContext } from 'scripts/deploy/framework/NWContext'

export abstract class IEnvGenerator<BaseEnv> {
  public abstract generate (context: NightworkersContext) : BaseEnv
}

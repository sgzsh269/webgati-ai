import { SWState } from "../../utils/types";

export class SWService {
  public swState: SWState;

  constructor() {
    this.swState = {
      installType: null,
      tabIdStateMap: {},
    };
  }
}

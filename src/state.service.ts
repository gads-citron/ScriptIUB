import fs from "fs";

const STATE_FILE_PATH = "./state.json";

export interface State {
  filename?: string;
  timestamp: number;
}

const defaultState = (date = new Date()): State => ({
  timestamp: date.getTime(),
});

export const getState = (date = new Date()): State => {
  let state = defaultState(date);
  if (fs.existsSync(STATE_FILE_PATH)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf-8"));
  } else {
    setState(state);
  }
  return state;
};

export const setState = (state: State): void => {
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state));
};

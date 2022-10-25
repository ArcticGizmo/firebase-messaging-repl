import './env';
import * as repl from 'repl';
import * as fb from './firebase';
import type { Context } from 'vm';

const clear = () => {
  process.stdout.write('\u001B[2J\u001B[0;0f');
};

// A "local" node repl with a custom prompt
const local = repl.start({ prompt: 'fb:messaging> ' });

const oldEval = local.eval;

function newEval(
  cmd: string,
  context: Context,
  filename: string,
  callback: (err: Error | null, result: any) => void
) {
  if (!cmd.startsWith('fb')) {
    oldEval.call(this, ...arguments);
    return;
  }

  let newCmd = `await ${cmd.trimEnd()}`;

  if (!newCmd.includes('send()') && newCmd.includes('compose()')) {
    newCmd += '.send()';
  }

  console.log(newCmd);
  oldEval.call(this, newCmd, context, filename, callback);
}

Object.defineProperty(local, 'eval', {
  value: newEval
});

local.context.clear = clear;
local.context.fb = fb;

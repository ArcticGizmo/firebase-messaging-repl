import './env';
import * as repl from 'repl';
import * as fb from './firebase';
import type { Context } from 'vm';
import { exit } from 'process';

const clear = () => {
  process.stdout.write('\u001B[2J\u001B[0;0f');
};

const SPECIAL_KEYWORDS = [
  { key: 'clear', call: clear },
  { key: 'exit', call: () => exit(0) }
];

const local = repl.start({ prompt: `fb:${fb.getProjectId()}> ` });

const oldEval = local.eval;

function newEval(
  cmd: string,
  context: Context,
  filename: string,
  callback: (err: Error | null, result: any) => void
) {
  for (const special of SPECIAL_KEYWORDS) {
    if (cmd.startsWith(special.key)) {
      special.call();
      return;
    }
  }

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

local.context.fb = fb;
local.context.accounts = () => fb.getAccounts();
local.context.setAccount = (aliasOrProjectId: string) => {
  fb.setProject(aliasOrProjectId);
  local.setPrompt(`fb:${fb.getProjectId()}> `);
};

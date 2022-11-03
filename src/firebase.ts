import { applicationDefault, initializeApp, deleteApp } from 'firebase-admin/app';
import type { App, AppOptions, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import type {
  Messaging,
  MessagingPayload,
  MessagingOptions,
  Message,
  BaseMessage,
  Notification
} from 'firebase-admin/messaging';
import { credential } from 'firebase-admin';
import glob from 'glob';

type NotificationData = { [key: string]: string };
type Recipient = { token: string } | { topic: string } | { condition: string };

const TOKEN_ALIASES = {} as Record<string, string>;
const SERVICE_ACCOUNTS = loadServiceAccounts();

let app: App;
let messaging: Messaging;

const defaultCertName = process.env['DEFAULT_SERVICE_ACCOUNT_NAME'];
let cert = SERVICE_ACCOUNTS[process.env['DEFAULT_SERVICE_ACCOUNT_NAME']];

if (!cert) {
  console.log(
    `Could not find service account for default '${defaultCertName}'. The first available will be used`
  );
  cert = Object.values(SERVICE_ACCOUNTS)[0];
}

if (!cert) {
  throw new Error('Could not find any service accounts. Terminiating');
}

createApp(cert);

function createApp(account: ServiceAccount) {
  const config: AppOptions = {
    credential: credential.cert(account),
    projectId: account.projectId
  };

  if (app) {
    deleteApp(app);
  }

  app = initializeApp(config);
  messaging = getMessaging(app);
}

function loadServiceAccounts() {
  return glob.sync('**/*.sa.json', {}).reduce((acc, path) => {
    try {
      const raw = JSON.parse(fs.readFileSync(path).toString());
      const serviceAccount = {
        projectId: raw.project_id,
        clientEmail: raw.client_email,
        privateKey: raw.private_key
      };

      const name = path.replace('.sa.json', '');
      acc[name] = serviceAccount;
      acc[serviceAccount.projectId] = serviceAccount;
    } catch (error) {
      console.log(`Unable to load '${path}', check if a valid json file`);
    }

    return acc;
  }, {} as Record<string, ServiceAccount>);
}

export const send = async (message: Message) => {
  return messaging.send(message);
};

export const sendForToken = async (token: string, payload: BaseMessage) => {
  return send({ token, ...payload });
};

export const sendForAlias = async (alias: string, payload: BaseMessage) => {
  const token = getTokenFromAlias(alias);
  if (!token) {
    throw `No token found for alias ${alias}`;
  }

  return send({ token, ...payload });
};

export const sendForTopic = async (topic: string, payload: BaseMessage) => {
  return send({ topic, ...payload });
};

export const sendForCondition = async (condition: string, payload: BaseMessage) => {
  return send({ condition, ...payload });
};

export const sendTest = async (token: string) => {
  return send({
    token,
    notification: {
      title: 'Test Title',
      body: 'Test Body'
    }
  });
};

export const setTokenAlias = (alias: string, token: string) => {
  TOKEN_ALIASES[alias] = token;
};

export const getTokenFromAlias = (alias: string) => {
  return TOKEN_ALIASES[alias];
};

export const compose = () => new Chainable();

class Chainable {
  private _recipient?: Recipient;
  private _notification?: Notification;
  private _data?: NotificationData;

  async send() {
    const msg = {
      ...this._recipient,
      notification: this._notification,
      data: this._data
    };

    return send(msg);
  }

  to(recipient: Recipient) {
    this._recipient = recipient;
    return this;
  }

  toToken(token: string) {
    this._recipient = { token };
    return this;
  }

  toAlias(alias: string) {
    const token = TOKEN_ALIASES[alias];
    if (!token) {
      throw `No token found for alias '${alias}'`;
    }

    return this.toToken(token);
  }

  setNotification(title?: string, body?: string, imageUrl?: string) {
    this._notification = {
      title,
      body,
      imageUrl
    };
    return this;
  }

  setData(data: NotificationData) {}

  addData(key: string, value: string) {
    if (!this._data) {
      this._data = {};
    }

    this._data[key] = value;
    return this;
  }
}

export const getProjectId = () => app.options.projectId;

export const getAccounts = () => Object.keys(SERVICE_ACCOUNTS);

export const setProject = (aliasOrProjectId: string) => {
  const account = SERVICE_ACCOUNTS[aliasOrProjectId];

  if (!account) {
    console.log(`No account found for alias/projectID ${aliasOrProjectId}`);
    return;
  }

  createApp(account);
};

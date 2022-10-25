import { applicationDefault, initializeApp } from 'firebase-admin/app';
import type { App, AppOptions } from 'firebase-admin/app';
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

type NotificationData = { [key: string]: string };
type Recipient = { token: string } | { topic: string } | { condition: string };

const TOKEN_ALIASES = {} as Record<string, string>;

const config: AppOptions = {
  credential: applicationDefault(),
  projectId: process.env['FIREBASE_PROJECT_ID']
};

const app = initializeApp(config);
const messaging = getMessaging(app);

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

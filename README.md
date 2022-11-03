# firebase-messaging-repl
A simple reply 

# Setup
You will need to download the `service-account.json` file from your firebase project and put it at the root of the project with a name like `{alias}.sa.json`. You can have mutliple service accounts and can switch between them inside the REPL. 

This file can be found via
* open [Cloud Messaging](https://console.firebase.google.com/u/0/project/_/settings/cloudmessaging)
* click `Manage Service Accounts`
* click the tree dots under `actions` for your account
* select `manage keys`
* then add a key
    * __keep this safe as it cannot be recovered__


You will also need to set your firebase project ID in .env as `FIREBASE_PROJECT_ID`. This value can be found under [general](https://console.firebase.google.com/u/0/project/_/settings/general)

# Run
```
npm install
npm start
```

## Simple Messages

### General Message
```
fb.send({
    token: "",
    notification: {
        title: "my title",
        body: "my body",
    },
    data: {
        key1: "4",
        key2: "6"
    }
})
```

### Token
shorthand for `send({token: '', ...})`
```
fb.sendForToken("my token", {...})
```

### Alias
shorthand for `send({token: '', ...})`, where the token is derived from the alias
```
fb.setTokenAlias("my alias", "my token");
fb.sendForAlias("my alias", {...});
```

### Topic
shorthand for `send({topic: '', ...})`
```
fb.sendForTopic("my topic", {...})
```

### Condition
shorthand for `send({condition: '', ...})`
```
fb.sendForCondition("my condition", {...})
```

### Test
If you just want to see if something is working, try the test endpoint
```
fb.sendTest("my token")
/*
notification: {
    title: "Test Title",
    body: "Test Body"
}
*/
```


## Composable Messages
Deeply nested JSON values in a REPL are annoying, so there is the chainable version for you to try

```
fb.compose()
    // set recipient (pick one)
    .to({topic: "my topic"})
    .toToken("my token")
    .toAlias("my alias")

    // notification (all fields optional)
    .setNotification("my title", "body", "imgUrl")

    // data
    .setData({key: value, key1: value2})

    // actually send it (optional, see note bellow)
    .send()
```

NB: you do not need to include `await` or `.send()` (for compose) if you are running simple REPL commands, the interface will automagically add these for you

"use client";

import React, { useEffect, useState } from "react";
import { useChannel, useConnectionStateListener } from "ably/react";
import styles from "./ChatBox.module.css";

export default function ChatBox() {
  let inputBox = null;
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const messageTextIsEmpty = messageText.trim().length === 0;

  const { channel, ably } = useChannel("chat-demo", (message) => {
    const history = receivedMessages.slice(-199);
    console.log("newMessage", message);
    setMessages([...history, message]);
  });

  const sendChatMessage = (messageText) => {
    let extras = {
      push: {
        notification: {
          title: "Hello from Ably!",
          body: "Example push notification from Ably.",
        },
        data: {
          foo: "bar",
          baz: "qux",
        },
      },
    };

    channel.publish({
      name: "chat-message",
      data: messageText,
      extras: extras,
    });
    setMessageText("");
    inputBox.focus();
  };

  const handleFormSubmission = (event) => {
    event.preventDefault();
    sendChatMessage(messageText);
  };

  const handleKeyPress = (event) => {
    if (event.charCode !== 13 || messageTextIsEmpty) {
      return;
    }
    sendChatMessage(messageText);
    event.preventDefault();
  };

  const getHistory = async () => {
    let history = await channel.history();
    console.log("history", history.items);
    setMessages(history.items);
  };

  useConnectionStateListener("connected", () => {
    getHistory();
  });
  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  }, [receivedMessages]);

  return (
    <div className={styles.chatHolder}>
      <div className={styles.chatText}>
        <MessagesBox
          messages={receivedMessages}
          ownConnectionId={ably.connection.id}
        />
        <div
          ref={(element) => {
            messageEnd = element;
          }}
        ></div>
      </div>
      <form onSubmit={handleFormSubmission} className={styles.form}>
        <textarea
          ref={(element) => {
            inputBox = element;
          }}
          value={messageText}
          placeholder="Type a message..."
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          className={styles.textarea}
        ></textarea>
        <button
          type="submit"
          className={styles.button}
          disabled={messageTextIsEmpty}
        >
          Send
        </button>
      </form>
    </div>
  );
}
function MessagesBox({ messages, ownConnectionId }) {
  return messages.map((message, index) => {
    const author = message.connectionId == ownConnectionId ? "me" : "other";
    return (
      <span key={index} className={styles.message} data-author={author}>
        {message.data}
      </span>
    );
  });
}

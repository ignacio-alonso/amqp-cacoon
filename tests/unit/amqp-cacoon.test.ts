import { expect } from 'chai';
import _ from 'lodash';
import 'mocha';
import AmqpCacoon, { Channel, ConsumeMessage } from '../../src';

let defaultMessageBusConfig = {
  // Protocol should be "amqp" or "amqps"
  protocol: 'amqp',
  // Username + Password on the RabbitMQ host
  username: 'valtech',
  password: 'iscool',
  // Host
  host: 'localhost',
  // Port
  port: 5672,
};
const config: any = {
  messageBus: {
    // Queue setup
    testQueue: 'test-queue',
  },
};

if (process.env.RABBITMQ_CONNECTION_STRING) {
  config.messageBus.connectionString = process.env.RABBITMQ_CONNECTION_STRING;
} else {
  _.extend(config.messageBus, defaultMessageBusConfig);
}

import log4js from 'log4js';

let logger = log4js.getLogger();
logger = log4js.getLogger('synchronous');
logger.level = 'trace';

describe('Amqp Cacoon', () => {
  // Just make sure it initializes
  it('Constructor: Initializes', () => {
      console.log(process.env);
    new AmqpCacoon({
      protocol: config.messageBus.protocol,
      username: config.messageBus.username,
      password: config.messageBus.password,
      host: config.messageBus.host,
      port: config.messageBus.port,
      amqp_opts: {},
      providers: {
        logger: logger,
      },
    });
  });

  it('getConsumerChannel() - channel is returned', async () => {
    let amqpCacoon: any;
    try {
      amqpCacoon = new AmqpCacoon({
        protocol: config.messageBus.protocol,
        username: config.messageBus.username,
        password: config.messageBus.password,
        host: config.messageBus.host,
        port: config.messageBus.port,
        amqp_opts: {},
        providers: {
          logger: logger,
        },
      });
      let channel: Channel | null = await amqpCacoon.getConsumerChannel();
      expect(channel, 'Is undefined').to.not.be.undefined;
      expect(channel, 'Is null').to.not.be.null;

      if (amqpCacoon) amqpCacoon.close();
    } catch (e) {
      if (amqpCacoon) amqpCacoon.close();
      throw e;
    }
  });

  it('getPublishChannel() - channel is returned', async () => {
    let amqpCacoon: any;
    try {
      amqpCacoon = new AmqpCacoon({
        protocol: config.messageBus.protocol,
        username: config.messageBus.username,
        password: config.messageBus.password,
        host: config.messageBus.host,
        port: config.messageBus.port,
        amqp_opts: {},
        providers: {
          logger: logger,
        },
      });
      let channel: Channel | null = await amqpCacoon.getPublishChannel();
      expect(channel, 'Is undefined').to.not.be.undefined;
      expect(channel, 'Is null').to.not.be.null;

      if (amqpCacoon) amqpCacoon.close();
    } catch (e) {
      if (amqpCacoon) amqpCacoon.close();
      throw e;
    }
  });

  it('publish/consume - Published message is received correctly', async () => {
    let amqpCacoon: AmqpCacoon | null = null;
    try {
      amqpCacoon = new AmqpCacoon({
        protocol: config.messageBus.protocol,
        username: config.messageBus.username,
        password: config.messageBus.password,
        host: config.messageBus.host,
        port: config.messageBus.port,
        amqp_opts: {},
        providers: {
          logger: logger,
        },
      });
      let channel: Channel | null = await amqpCacoon.getPublishChannel();
      if (channel) await channel.assertQueue(config.messageBus.testQueue);

      await new Promise(async (resolve, reject) => {
        if (!amqpCacoon) {
          return reject(
            new Error('Some how amqpCacoon is null. This should not happen')
          );
        }
        await amqpCacoon.publish(
          '',
          config.messageBus.testQueue,
          Buffer.from('TestString')
        );
        let resolved = false;
        amqpCacoon.registerConsumer(
          config.messageBus.testQueue,
          async (channel: Channel, msg: ConsumeMessage) => {
            try {
              expect(msg.content.toString(), 'Wrong message received').to.equal(
                'TestString'
              );
              if (!resolved) {
                resolve();
                resolved = true;
              }
            } catch (e) {
              reject(e);
            }
          }
        );
        setTimeout(() => {
          if (!resolved) {
            reject(new Error('Message rx: Timed out'));
            resolved = true;
          }
        }, 200);
      });
      if (amqpCacoon) amqpCacoon.close();
    } catch (e) {
      if (amqpCacoon) amqpCacoon.close();
      throw e;
    }
  });
});

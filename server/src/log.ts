import type { LogType } from 'loved-bridge/tables';
import { inspect } from 'util';
import type { MysqlConnectionType } from './db';
import db from './db';

const syslogPrefix = process.env.LOG_SYSLOG_LEVEL_PREFIX === '1';

export function dbLog(
  type: LogType,
  values?: Record<string, unknown>,
  connection?: MysqlConnectionType,
): Promise<{ insertId: number }> {
  return (connection ?? db).query('INSERT INTO logs SET ?', [
    {
      created_at: new Date(),
      type,
      values: values == null ? null : JSON.stringify(values),
    },
  ]);
}

export function systemLog(message: unknown, level: SyslogLevel): void {
  if (syslogPrefix) {
    if (typeof message !== 'string') {
      message = inspect(message, { depth: null });
    }

    message = (message as string)
      .trim()
      .split('\n')
      .map((line) => `<${level}>${line}`)
      .join('\n');
  }

  if (level <= SyslogLevel.warning) {
    console.error(message);
  } else {
    console.log(message);
  }
}

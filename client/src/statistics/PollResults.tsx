import { ChangeEvent, useState } from 'react';
import { apiErrorMessage, getPollResults, useApi } from '../api';
import { BeatmapInline } from '../BeatmapInline';
import { GameMode, IPollResult } from '../interfaces';
import { gameModeLongName } from '../osu-helpers';

export default function PollResults() {
  const [gameMode, setGameMode] = useState<GameMode>();
  const [polls, pollsError] = useApi(getPollResults);
  const [roundOrderAsc, setRoundOrderAsc] = useState(false);
  const [showPercent, setShowPercent] = useState(true);

  if (pollsError != null)
    return <span className='panic'>Failed to load poll results: {apiErrorMessage(pollsError)}</span>;

  if (polls == null)
    return <span>Loading poll results...</span>;

  const onGameModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value;

    setGameMode(value === 'all' ? undefined : parseInt(value));
  };

  let displayPolls = [...polls];

  if (gameMode != null)
    displayPolls = displayPolls.filter((poll) => poll.game_mode === gameMode);

  if (roundOrderAsc)
    displayPolls.sort((a, b) => a.round - b.round);

  return (
    <>
      <div className='flex-left'>
        <label htmlFor='gameMode'>Game mode:</label>
        <select
          name='gameMode'
          value={gameMode}
          onChange={onGameModeChange}
        >
          <option value='all'>All</option>
          {[0, 1, 2, 3].map((m) => (
            <option value={m}>{gameModeLongName(m)}</option>
          ))}
        </select>
        <label htmlFor='roundOrder'>Round order:</label>
        <select
          name='roundOrder'
          value={roundOrderAsc ? '1' : '0'}
          onChange={(event) => setRoundOrderAsc(event.currentTarget.value === '1')}
        >
          <option value='0'>Descending</option>
          <option value='1'>Ascending</option>
        </select>
        <label htmlFor='resultDisplay'>Result display:</label>
        <select
          name='resultDisplay'
          value={showPercent ? '0' : '1'}
          onChange={(event) => setShowPercent(event.currentTarget.value === '0')}
        >
          <option value='0'>Percent and total</option>
          <option value='1'>Yes and no</option>
        </select>
      </div>
      <table className='poll-results'>
        <tr className='sticky'>
          <th>Round</th>
          {gameMode == null &&
            <th>Game mode</th>
          }
          <th>Beatmapset</th>
          <th>Poll topic</th>
          {showPercent
            ? (
              <>
                <th>Percent</th>
                <th>Total</th>
              </>
            ) : (
              <>
                <th>Yes</th>
                <th>No</th>
              </>
            )}
        </tr>
        {displayPolls.map((poll) => (
          <tr key={poll.id}>
            <td>{poll.round}</td>
            {gameMode == null &&
              <td>{gameModeLongName(poll.game_mode)}</td>
            }
            <td className='force-normal-wrap'>
              {poll.beatmapset == null
                ? <i>Deleted beatmapset</i>
                : <BeatmapInline beatmapset={poll.beatmapset} gameMode={poll.game_mode} showCreator />
              }
            </td>
            <td><a href={`https://osu.ppy.sh/community/forums/topics/${poll.topic_id}`}>{poll.topic_id}</a></td>
            <ResultCells poll={poll} showPercent={showPercent} />
          </tr>
        ))}
      </table>
    </>
  );
}

type ResultCellsProps = {
  poll: IPollResult;
  showPercent: boolean;
};

function ResultCells({ poll, showPercent }: ResultCellsProps) {
  const yes = poll.result_yes;
  const no = poll.result_no;
  const total = yes + no;
  const yesFraction = yes / total;

  const className = poll.voting_threshold == null ? undefined
    : yesFraction >= poll.voting_threshold ? 'success' : 'error';

  return showPercent
    ? (
      <>
        <td className={className}>{(yesFraction * 100).toFixed(2)}%</td>
        <td>{total}</td>
      </>
    ) : (
      <>
        <td className={className}>{yes}</td>
        <td>{no}</td>
      </>
    );
}

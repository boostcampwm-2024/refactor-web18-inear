import { splitTime } from '@/shared/util/timeUtils';
interface AlbumArtistProps {
  artist: string;
  songLength: number;
  totalDuration: number;
}

export function AlbumArtist({
  artist,
  songLength,
  totalDuration,
}: AlbumArtistProps) {
  return (
    <section
      className={
        'text-lg text-grayscale-400 mt-4 flex justify-start overflow-visible whitespace-nowrap absolute max-w-[calc(100vw-340px)]'
      }
    >
      <span className={'truncate'}>{artist}</span>
      <p className={'flex-shrink-0 flex-grow-0 whitespace-nowrap'}>
        <span className={'mx-2'}>•</span>
        <span>{songLength}곡</span>
      </p>
      <p className={'flex-shrink-0 flex-grow-0 whitespace-nowrap'}>
        <span className={'mx-2'}>•</span>
        <span>{splitTime(String(totalDuration))}</span>
      </p>
    </section>
  );
}

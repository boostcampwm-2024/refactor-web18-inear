import { Injectable } from '@nestjs/common';
import { AlbumRepository } from './album.repository';
import { AlbumRedisRepository } from './album.redis.repository';
import {
  MainBannerDto,
  MainBannerResponseDto,
} from './dto/main-banner-response.dto';
import { SideBarResponseDto } from './dto/side-bar-response.dto';
import { EndedAlbumResponseDto } from './dto/ended-album-response.dto';
import { AlbumDetailResponseDto } from './dto/album-detail-response.dto';

@Injectable()
export class AlbumService {
  constructor(
    private readonly albumRepository: AlbumRepository,
    private readonly albumRedisRepository: AlbumRedisRepository,
  ) {}
  async getMainBannerInfos(): Promise<MainBannerResponseDto> {
    const date = new Date();
    const albumBannerInfos =
      await this.albumRepository.getAlbumBannerInfos(date);

    const albumIds = albumBannerInfos.map((album) => album.albumId);
    const currentUserCounts =
      await this.albumRedisRepository.getCurrentUsersAll(albumIds);

    const banners = albumBannerInfos.map((album, index) =>
      MainBannerDto.from(album, currentUserCounts[index]),
    );
    return new MainBannerResponseDto(banners);
  }

  async getSideBarInfos(): Promise<SideBarResponseDto> {
    const date = new Date();
    const recentSideBarAlbums =
      await this.albumRepository.getRecentSideBarInfos(date);

    const upComingAlbums =
      await this.albumRepository.getUpComingSideBarInfos(date);
    return new SideBarResponseDto(recentSideBarAlbums, upComingAlbums);
  }

  async getEndedAlbums(): Promise<EndedAlbumResponseDto> {
    const date = new Date();
    const recentAlbums = await this.albumRepository.getEndedAlbumsInfos(date);

    return new EndedAlbumResponseDto(recentAlbums);
  }

  async getAlbumDetail(albumId: string): Promise<AlbumDetailResponseDto> {
    const albumDetail = await this.albumRepository.getAlbumDetailInfos(albumId);
    const albumSongDetail =
      await this.albumRepository.getAlbumDetailSongInfos(albumId);
    return new AlbumDetailResponseDto(albumDetail, albumSongDetail);
  }
}

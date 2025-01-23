#!/bin/bash

# healthy 상태 대기
waiting() {
    while true; do
        health_status_server=$(docker inspect --format '{{.State.Health.Status}}' server-$1)

        if [ "$health_status_server" != "starting" ]; then
            echo "$health_status_server"
            return 0
        fi

        sleep 5
    done
}

# nginx 설정 업데이트 및 리로드 함수
update_and_reload_nginx() {
    local target=$1
    NGINX_CONFIG="nginx/conf.d/default.conf"

    BACK_END_BLUE="server-blue:3000"
    BACK_END_GREEN="server-green:3000"
    echo "Updating nginx configuration for $target environment..."

    # 파일 업데이트
    echo $target
    # 리눅스 방식
    # if [ "$target" == "green" ]; then
    #     docker exec nginx sh -c "sed -i 's|server server-.*;|server $BACK_END_GREEN;|g' /etc/nginx/conf.d/default.conf"
    # else
    #     docker exec nginx sh -c "sed -i 's|server server-.*;|server $BACK_END_BLUE;|g' /etc/nginx/conf.d/default.conf"
    # fi

    if [ "$target" == "green" ]; then
        # MacOS 방식
        sed -i '' "s|server server-.*;|server $BACK_END_GREEN;|g" "$NGINX_CONFIG"
    else
        sed -i '' "s|server server-.*;|server $BACK_END_BLUE;|g" "$NGINX_CONFIG"
    fi

    # nginx 컨테이너 재시작
    echo "Restarting nginx to apply new configuration..."
    docker exec nginx nginx -s reload

    # 설정이 제대로 적용되었는지 확인
    sleep 2
    docker exec nginx nginx -t
}

# Blue에서 Green으로 전환
switch_to_green() {
    echo "Deploying Green environment..."

    cd ../../../

    # Green 환경 시작
    docker compose -f docker-compose-green.yml up -d

    health_status_server=$(waiting "green")
    echo $health_status_server
    if [ "$health_status_server" == "healthy" ]; then
        echo "Green server is healthy. Stopping and removing..."
        # nginx 설정 업데이트 및 리로드
        update_and_reload_nginx "green"

        echo "Stopping Blue server..."
        if docker ps -q --filter name=server-blue > /dev/null; then
            docker stop server-blue
            docker rm server-blue
        fi
    else
        echo "Green server is not Healthy"
        docker stop server-green
        docker rm server-green
    fi
}
# Green에서 Blue로 전환
switch_to_blue() {
    echo "Deploying Blue environment..."

    cd ../../../

    # Blue 환경 시작
    docker compose -f docker-compose-blue.yml up -d

    health_status_server=$(waiting "blue")
    echo $health_status_server
    if [ "$health_status_server" == "healthy" ]; then
        echo "Blue server is healthy. Stopping and removing..."

        # nginx 설정 업데이트 및 리로드
        update_and_reload_nginx "blue"

        echo "Stopping Green server..."
        if docker ps -q --filter name=server-green > /dev/null; then
            docker stop server-green
            docker rm server-green
        fi
    else
        echo "Blue server is not Healthy"
        docker stop server-blue
        docker rm server-blue
    fi
}

# 현재 실행 중인 환경 확인 및 전환
if [ -n "$(docker ps -q --filter name=blue)" ]; then
    switch_to_green
    echo "switch_to_green 실행"
else
    switch_to_blue
    echo "switch_to_blue 실행"
fi
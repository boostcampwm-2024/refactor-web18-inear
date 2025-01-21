#!/bin/bash

NGINX_CONFIG="nginx/conf.d/default.conf"

# nginx 설정 업데이트 및 리로드 함수
update_and_reload_nginx() {
    local target=$1

    echo "Updating nginx configuration for $target environment..."

    # 파일 업데이트
    echo $target
    if [ "$target" == "green" ]; then
        rm -rf nginx/html/dist-green
        cp -r nginx/html/dist nginx/html/dist-green
        sed -i "s|root /usr/share/nginx/html.*;|root /usr/share/nginx/html/dist-green;|g" $NGINX_CONFIG
    else
        rm -rf nginx/html/dist-blue
        cp -r nginx/html/dist nginx/html/dist-blue
        sed -i "s|root /usr/share/nginx/html.*;|root /usr/share/nginx/html/dist-blue;|g" $NGINX_CONFIG
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
    # nginx 설정 업데이트 및 리로드
    update_and_reload_nginx "green"

}
# Green에서 Blue로 전환
switch_to_blue() {
    echo "Deploying Blue environment..."

    cd ../../../

    # nginx 설정 업데이트 및 리로드
    update_and_reload_nginx "blue"
}

# 현재 실행 중인 환경 확인 및 전환
if [ -n "$(cat $NGINX_CONFIG | grep html/dist-blue)" ]; then
    switch_to_green
    echo "switch_to_green 실행"
else
    switch_to_blue
    echo "switch_to_blue 실행"
fi
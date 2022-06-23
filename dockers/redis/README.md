## Redis Docker Compose

### 이미지 실행
```
docker-compose up -d
```

상태 확인은 `docker ps`

### Redis CLI
#### 접속하는 법
```
docker exec -it redis bash
# redis-cli -a {passwd}
```

#### 사용법
data 추가
```
set {key} {value}
```

data 확인
```
# 모든 key에 대한 value 보기
keys *

# key1의 value 보기
get key1 
```

### 컨테이너 정지 
```
docker-compose down
```

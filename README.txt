월화 계산기 + 블로그 관리자형 스타터

중요: 이 버전은 로그인/게시글 저장 기능을 서버에서 실행하도록 Cloudflare Pages Functions + D1 데이터베이스를 사용합니다. 단순히 index.html을 더블클릭하거나 기존처럼 ZIP만 Direct Upload하면 관리자 기능은 작동하지 않습니다. 서버 기능이 있는 프로젝트로 배포하고 데이터베이스/환경변수를 설정해야 합니다.

포함 기능
- 메인 계산기 8종
- 블로그 목록 페이지: /blog.html
- 관리자 페이지: /admin.html
- 관리자 로그인, 글 작성/수정/삭제
- D1 데이터베이스에 게시글 저장
- 로그인 세션은 HttpOnly + Secure 쿠키로 보호

배포 전 준비
1) GitHub 계정을 만들고 새 비공개 저장소(repository)를 만듭니다.
2) 이 ZIP의 모든 파일과 폴더를 저장소 최상위에 업로드합니다. index.html, functions 폴더, wrangler.jsonc 등이 최상위에 있어야 합니다.
3) Cloudflare 대시보드 > Workers & Pages에서 Pages 프로젝트를 만들고 GitHub 저장소를 연결합니다. Pages Functions는 Direct Upload 배포로 지원되지 않으므로 Git 연동 배포를 사용해야 합니다.
4) Cloudflare 대시보드에서 D1 데이터베이스를 만들고 이름을 wolhwa-blog-db로 지정합니다.
5) D1 콘솔에서 schema.sql의 SQL 전체를 실행해 posts 테이블을 만듭니다.
6) D1 데이터베이스의 Database ID를 복사해 wrangler.jsonc의 REPLACE_WITH_DATABASE_ID를 실제 ID로 바꿉니다. 변경한 파일을 GitHub에 다시 올립니다.
7) Pages 프로젝트 > Settings > Bindings > Add > D1 database binding에서 Variable name은 DB, 데이터베이스는 wolhwa-blog-db로 연결합니다. 저장 후 재배포합니다.
8) Pages 프로젝트 > Settings > Variables and Secrets(또는 Environment variables)에서 Production 환경에 다음 두 항목을 추가합니다.
   - ADMIN_PASSWORD: 관리자 로그인 비밀번호. 길고 추측하기 어려운 비밀번호를 사용하세요.
   - SESSION_SECRET: 길고 무작위인 비밀 문자열(최소 32자 권장). 관리자 비밀번호와 다르게 설정하세요.
   이 값들은 HTML/JavaScript 파일 안에 넣지 마세요. 설정 후 재배포합니다.
9) 사이트주소/admin.html 에서 ADMIN_PASSWORD로 로그인합니다. 사이트주소/blog.html 에서 게시글 공개 여부를 확인합니다.

초보자 주의사항
- 이 프로젝트는 서버 설정이 필요한 기본 버전입니다. 계정/DB/환경변수 설정을 끝내기 전에는 온라인 관리자 기능이 완성된 것이 아닙니다.
- ADMIN_PASSWORD 또는 SESSION_SECRET을 공개 저장소, 화면 캡처, 블로그 글에 올리지 마세요. GitHub 저장소는 비공개로 유지하는 것을 권장합니다.
- 현재 게시글은 일반 텍스트 본문입니다. 이미지 업로드, 카테고리, 검색, 자동 저장, 비밀번호 재설정 기능은 포함하지 않습니다.
- 관리자 비밀번호를 잊으면 Cloudflare 환경변수에서 ADMIN_PASSWORD를 새 값으로 바꾸고 재배포하면 됩니다.
- 로그인 세션은 8시간 후 만료됩니다.
- 문의용 이메일과 개인정보 처리 안내는 실제 운영 정보에 맞게 고쳐야 합니다.
- 광고는 아직 연결되어 있지 않습니다. 광고 계정 승인 후 공식 광고 코드를 안전하게 추가해야 합니다.

수정 방법
- 디자인: style.css
- 계산기 동작: script.js
- 메인 화면: index.html
- 블로그 공개 화면: blog.html
- 관리자 화면: admin.html
- 서버 API: functions 폴더
- 데이터베이스 구조: schema.sql

Cloudflare 공식 안내:
https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
https://developers.cloudflare.com/pages/functions/get-started/
https://developers.cloudflare.com/pages/functions/bindings/

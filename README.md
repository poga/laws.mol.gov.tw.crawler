# 勞基法函釋爬蟲

自動從 [勞動部勞動法令查詢系統](https://laws.mol.gov.tw/FINT/index-1.aspx) 抓取新的函釋，如果跟 [班表小幫手](https://github.com/g0v/tw-shift-schedule) 相關就自動開 issue

## Usage

1. Install dependencies

```
$ npm i
```

2. Run the crawler

```
$ TOKEN=YOUR_GITHUB_OAUTH_TOKEN node index.js
```

Setup cronjob if necessary.

## License

The MIT License
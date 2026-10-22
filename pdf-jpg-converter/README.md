# PDF ↔ JPG Converter

PDF를 JPG로, JPG를 PDF로 바꿔주는 간단한 명령줄 프로그램입니다. 무료이며 누구나 자유롭게 사용할 수 있습니다.

- **PDF → JPG**: 페이지마다 JPG 한 장씩 저장
- **JPG → PDF**: 여러 이미지를 한 개의 PDF로 합치기 (JPG, PNG, BMP, TIFF, WebP 지원)
- 입력 파일의 확장자를 보고 변환 방향을 자동으로 판단합니다.

## 설치

Python 3.9 이상이 필요합니다.

```bash
git clone https://github.com/hey7995/hey7995.github.io.git
cd hey7995.github.io/pdf-jpg-converter
pip install -r requirements.txt
```

## 사용법

### PDF → JPG

```bash
python converter.py 문서.pdf
python converter.py 문서.pdf -o 출력폴더 --dpi 200 --quality 90
```

기본값은 `문서_jpg/` 폴더에 `문서_001.jpg`, `문서_002.jpg`, … 형태로 저장됩니다.

### JPG → PDF

```bash
python converter.py 1.jpg 2.jpg 3.jpg -o 결과.pdf
python converter.py 사진폴더/ -o 결과.pdf
```

폴더를 넣으면 파일 이름순으로 합칩니다.

## 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `-o`, `--output` | 출력 폴더(PDF→JPG) 또는 출력 PDF 파일명(JPG→PDF) | 입력 파일 옆 |
| `--dpi` | PDF→JPG 해상도. 글자가 작으면 200~300 권장 | 150 |
| `--quality` | JPG 품질 (1~100) | 90 |

## 참고

- 휴대폰으로 찍은 사진의 회전 정보를 자동으로 반영합니다.
- 투명 배경 PNG는 흰 배경으로 변환됩니다.
- 암호가 걸린 PDF는 변환할 수 없습니다.

## 라이선스

[MIT License](LICENSE) — 개인·상업적 용도 모두 무료로 사용, 수정, 배포할 수 있습니다.

사용하는 라이브러리: [pypdfium2](https://github.com/pypdfium2-team/pypdfium2) (BSD-3-Clause / Apache-2.0), [Pillow](https://python-pillow.org/) (HPND)

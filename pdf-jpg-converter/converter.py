#!/usr/bin/env python3
"""
PDF <-> JPG 변환기

사용법
------
PDF -> JPG (페이지마다 JPG 한 장씩 생성)
    python converter.py input.pdf
    python converter.py input.pdf -o 출력폴더 --dpi 200 --quality 90

JPG -> PDF (여러 장을 한 PDF로 합치기)
    python converter.py page1.jpg page2.jpg -o result.pdf
    python converter.py 사진폴더/ -o result.pdf

입력 파일의 확장자를 보고 변환 방향을 자동으로 판단합니다.

필요한 패키지
------------
    pip install -r requirements.txt
"""

import argparse
import sys
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image, ImageOps

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def pdf_to_jpg(pdf_path: Path, out_dir: Path, dpi: int = 150, quality: int = 90) -> list[Path]:
    """PDF의 각 페이지를 JPG로 저장하고, 생성된 파일 경로 목록을 반환."""
    try:
        pdf = pdfium.PdfDocument(str(pdf_path))
    except pdfium.PdfiumError as e:
        if "password" in str(e).lower():
            raise ValueError(f"암호가 걸린 PDF입니다: {pdf_path}") from e
        raise ValueError(f"PDF를 열 수 없습니다: {pdf_path} ({e})") from e

    out_dir.mkdir(parents=True, exist_ok=True)
    results = []
    try:
        total = len(pdf)
        digits = max(3, len(str(total)))
        scale = dpi / 72  # PDF 기본 해상도는 72dpi
        for i in range(total):
            page = pdf[i]
            image = page.render(scale=scale).to_pil().convert("RGB")
            out_file = out_dir / f"{pdf_path.stem}_{i + 1:0{digits}d}.jpg"
            image.save(out_file, "JPEG", quality=quality)
            results.append(out_file)
            print(f"  [{i + 1}/{total}] {out_file.name}")
            page.close()
    finally:
        pdf.close()
    return results


def collect_images(inputs: list[Path]) -> list[Path]:
    """파일/폴더 입력을 이미지 파일 목록으로 펼침 (폴더는 이름순 정렬)."""
    files = []
    for p in inputs:
        if p.is_dir():
            files += sorted(
                (f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS),
                key=lambda f: f.name.lower(),
            )
        elif p.suffix.lower() in IMAGE_EXTS:
            files.append(p)
        else:
            print(f"  건너뜀 (지원하지 않는 형식): {p}")
    return files


def jpg_to_pdf(images: list[Path], out_pdf: Path) -> Path:
    """이미지 여러 장을 한 PDF로 합침 (한 장 = 한 페이지)."""
    if not images:
        raise ValueError("변환할 이미지가 없습니다.")
    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    pages = []
    for img_path in images:
        img = Image.open(img_path)
        img = ImageOps.exif_transpose(img)  # 휴대폰 사진 회전 정보 반영
        if img.mode != "RGB":
            img = img.convert("RGB")  # PNG 투명 배경 등 처리
        pages.append(img)
        print(f"  추가: {img_path.name}")
    pages[0].save(out_pdf, "PDF", save_all=True, append_images=pages[1:], resolution=150.0)
    return out_pdf


def main() -> int:
    parser = argparse.ArgumentParser(description="PDF <-> JPG 변환기")
    parser.add_argument("inputs", nargs="+", type=Path, help="PDF 파일, 또는 이미지 파일/폴더")
    parser.add_argument("-o", "--output", type=Path, help="출력 폴더(PDF→JPG) 또는 출력 PDF 파일명(JPG→PDF)")
    parser.add_argument("--dpi", type=int, default=150, help="PDF→JPG 해상도 (기본 150)")
    parser.add_argument("--quality", type=int, default=90, help="JPG 품질 1~100 (기본 90)")
    args = parser.parse_args()

    for p in args.inputs:
        if not p.exists():
            print(f"오류: 찾을 수 없습니다 - {p}")
            return 1

    if all(p.suffix.lower() == ".pdf" for p in args.inputs):
        # PDF -> JPG
        for pdf in args.inputs:
            out_dir = args.output or pdf.parent / f"{pdf.stem}_jpg"
            print(f"{pdf.name} -> JPG")
            try:
                files = pdf_to_jpg(pdf, out_dir, args.dpi, args.quality)
            except Exception as e:
                print(f"  실패: {e}")
                return 1
            print(f"완료: {len(files)}장 -> {out_dir}")
    else:
        # JPG -> PDF
        images = collect_images(args.inputs)
        first = args.inputs[0]
        out_pdf = args.output or (first / "merged.pdf" if first.is_dir() else first.with_suffix(".pdf"))
        print(f"이미지 {len(images)}장 -> PDF")
        try:
            jpg_to_pdf(images, out_pdf)
        except Exception as e:
            print(f"  실패: {e}")
            return 1
        print(f"완료: {out_pdf}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

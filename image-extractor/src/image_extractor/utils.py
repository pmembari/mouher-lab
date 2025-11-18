from loguru import logger
import pandas as pd
import numpy as np
import rasterio
import os
from datetime import datetime
from pathlib import Path
from rasterio.errors import RasterioIOError
from tqdm.auto import tqdm



def sort_group(df):
    return df.sort_values(by="position", ascending=True)



def save_images_and_adjust_path_in_csv(df, base_dir="data/images"):
    """
    Save product images AND return a new dataframe with updated local paths.

    Parameters:
        df: pandas.DataFrame with columns:
            - path (URL to image)
            - product_id
            - slug
            - updated_at_y
        base_dir: root folder for saved images

    Returns:
        pandas.DataFrame (with updated 'path' column pointing to saved images)
    """

    base_dir = Path(base_dir)
    base_dir.mkdir(parents=True, exist_ok=True)

    new_paths = []   # store updated local image paths

    for row in tqdm(df.itertuples(index=False), total=len(df), desc="Saving images"):

        url = row.path
        product_id = str(row.product_id)
        
        
        # Clean formatted date
        try:
            date_str = pd.to_datetime(row.updated_at_y).strftime("%Y_%m_%d")
        except Exception:
            new_paths.append(None)
            continue

        # Directory for this product
        
        product_dir = base_dir / product_id
        product_dir.mkdir(parents=True, exist_ok=True)

        # Determine next file index
        existing = list(product_dir.glob("*.jpg"))
        file_idx = len(existing) + 1

        filename = f"{file_idx}_{date_str}.jpg"
        save_path = product_dir / filename

        # Update local path in dataframe (even if file already exists)
        new_paths.append(str(save_path))

        # Skip download if already exists
        if save_path.exists():
            continue

        # Load and save image
        try:
            with rasterio.open(url) as src:
                data = src.read()
                if data.shape[0] > 3:
                    continue
                profile = src.profile
        except RasterioIOError:
            continue
        except Exception:
            continue

        # Update profile for JPEG
        profile.update(driver="JPEG", dtype=data.dtype, count=min(data.shape[0], 3))

        try:
            with rasterio.open(save_path, "w", **profile) as dst:
                dst.write(data[:3])  # ensure max 3 bands
        except Exception:
            continue

        # Remove Rasterio sidecar file
        aux = save_path.with_suffix(".jpg.aux.xml")
        if aux.exists():
            aux.unlink()

    # Return updated dataframe
    df = df.copy()
    df["path"] = new_paths

    return df

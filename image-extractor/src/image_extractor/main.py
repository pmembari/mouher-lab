import os
import click
from tqdm import tqdm
from loguru import logger
import pandas as pd
from .utils import (sort_group, save_images_and_adjust_path_in_csv)


@click.command(
    short_help="This service will provide spatial mosaicking for sentinel-2 products",
    help="This service will provide spatial mosaicking for sentinel-2 products",
)
@click.option(
    "--products-csv",
    "-p",
    "products_csv",
    help="A path to csv file containing product information",
    type=str,
    required=True,
)
@click.option(
    "--product-images-csv",
    "-i",
    "product_images_csv",
    help="A path to csv file containing product image url",
    type=str,
    required=True,
    
)
@click.pass_context
def main(ctx, **kwargs):
    logger.info("Start image extractor.")
    products_csv_path = kwargs.get("products_csv")
    product_images_csv_path = kwargs.get("product_images_csv")
    products_df = pd.read_csv(products_csv_path).rename(columns={"id": "product_id"})
    product_image_df = pd.read_csv(product_images_csv_path).drop(columns=["id"], axis=1)
    product_image_df = product_image_df.groupby("product_id", group_keys=False).apply(sort_group)
    merged_df = product_image_df.merge(products_df, on="product_id", how="left")
    merged_df["path"] = merged_df["path"].apply(lambda x: "http://cdn.mouherwear1.com" + str(x))
    merged_df = save_images_and_adjust_path_in_csv(merged_df)
    merged_df.to_csv("merged_product_info.csv")
    logger.success("Done.")


if __name__ == "__main__":
    main()
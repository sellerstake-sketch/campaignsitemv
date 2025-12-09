#!/usr/bin/env python3
"""
Generate an index file mapping voter ID card numbers to image filenames.
This index is used by the client-side code to quickly find images in static hosting.
Run this script before deploying to generate images/index.json
"""
import json
from pathlib import Path

def generate_image_index():
    """Generate a JSON index mapping ID card numbers to image filenames."""
    images_dir = Path('images')
    
    if not images_dir.exists():
        print(f"Error: Images directory '{images_dir}' does not exist")
        return
    
    # Dictionary to store ID -> filename mappings
    image_index = {}
    
    # Supported image extensions
    extensions = ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']
    
    # Scan all image files
    for ext in extensions:
        for img_file in images_dir.glob(f'*{ext}'):
            filename = img_file.name
            
            # Extract ID card number from filename
            # Patterns: "A241695.Photo ID.171348.png" or "A241695.png"
            # ID is typically at the start, before first dot or space
            id_card = None
            
            # Try to extract ID from start of filename
            # ID format is typically like "A241695" (letter followed by digits)
            if '.' in filename:
                # Get the part before the first dot
                potential_id = filename.split('.')[0].strip()
                # Check if it looks like an ID (starts with letter, followed by digits)
                if potential_id and len(potential_id) >= 6 and potential_id[0].isalpha() and potential_id[1:].isdigit():
                    id_card = potential_id.upper()
            else:
                # No dots, check if entire filename (minus extension) is an ID
                potential_id = filename.rsplit('.', 1)[0].strip()
                if potential_id and len(potential_id) >= 6 and potential_id[0].isalpha() and potential_id[1:].isdigit():
                    id_card = potential_id.upper()
            
            if id_card:
                # Store the image path relative to root
                image_path = f"images/{filename}"
                
                # If multiple images for same ID, keep the first one found
                # (or you could modify this to store an array)
                if id_card not in image_index:
                    image_index[id_card] = image_path
                    print(f"Mapped {id_card} -> {image_path}")
                else:
                    print(f"Warning: Multiple images for {id_card}, keeping first: {image_index[id_card]}")
    
    # Write index to JSON file
    index_file = images_dir / 'index.json'
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(image_index, f, indent=2, ensure_ascii=False)
    
    print(f"\nGenerated image index with {len(image_index)} entries")
    print(f"Index saved to: {index_file}")
    return image_index

if __name__ == "__main__":
    generate_image_index()


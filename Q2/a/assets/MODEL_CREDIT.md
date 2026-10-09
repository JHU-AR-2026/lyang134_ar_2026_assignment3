# Duck: model credit, source, and changes

Model: Duck, the COLLADA rubber-duck bath toy.
Creator/copyright: Copyright 2006 Sony.
Repository: KhronosGroup/glTF-Sample-Assets.
Model license: SCEA Shared Source License, Version 1.0 (not CC BY or CC0).

Source model page:
https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Duck

Source mesh variant used:
https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/Duck/glTF-Draco

Authoritative license:
https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/LICENSES/SCEA.txt

The included GLB is a modified packaging of the repository's Draco-compressed
Duck mesh, not a byte-identical copy of its glTF-Binary/Duck.glb download.

Changes:
- The downloaded Draco geometry bytes are preserved unchanged.
- The original bitmap texture is replaced by a solid-yellow material.
- The unused source camera is omitted.
- Geometry, material, and scene metadata are combined into a single GLB file.

The source geometry's Git blob SHA-1 was checked:
`65219de6ecc4d7e63738797b1fdc9a7e92668354` (10,368 bytes).
Included GLB SHA-256: `a4423d03d1e61d32002dd62f3d078f4f5ee3e3ba25f37c365daea736f8423167`.

This model uses KHR_draco_mesh_compression. Babylon's glTF loader supports Draco
and normally loads its decoder from the Babylon CDN. A browser test needs
internet access unless the Babylon libraries and Draco decoder are hosted locally.
Loader documentation:
https://doc.babylonjs.com/features/featuresDeepDive/importers/glTF

This is our chosen third-party asset, not an instructor-specified model.
The original upstream model README is included for attribution and reference;
its relative links refer to the upstream repository, and its screenshot describes
the original textured model rather than this solid-yellow variant.

Preserve the model attribution, license, and modification notice when sharing.

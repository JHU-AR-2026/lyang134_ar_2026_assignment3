// Assignment starter: https://playground.babylonjs.com/#JJVK0D
var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
    ground.isVisible = false;

    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.position.y = 1;
    sphere.position.x = 1;

    var cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameter: 1 }, scene);
    cylinder.position.y = 1;
    cylinder.position.x = -1;

    // Vertex shader: object coordinates to world and clip coordinates.
    BABYLON.Effect.ShadersStore["customVertexShader"] = `
    precision highp float;
    attribute vec3 position;
    attribute vec3 normal;
    uniform mat4 world;
    uniform mat4 worldViewProjection;
    varying vec3 vPosW;
    varying vec3 vNormalW;

    void main() {
        vec4 pw = world * vec4(position, 1.0);
        vPosW = pw.xyz;
        vNormalW = normalize(mat3(world) * normal);
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }`;

    // Fragment shader: world-space Phong lighting.
    BABYLON.Effect.ShadersStore["customFragmentShader"] = `
    precision highp float;
    varying vec3 vPosW;
    varying vec3 vNormalW;

    uniform float uMatAmbient;
    uniform vec3 uMatDiffuse;
    uniform vec3 uMatSpecular;
    uniform float uMatShininess;
    uniform vec3 uCameraPos;
    uniform vec3 uPointLightColor;
    uniform vec3 uPointLightPos;
    uniform vec3 uPointLightColor2;
    uniform vec3 uPointLightPos2;

    vec3 shadePointLight(
        vec3 lColor, vec3 lPos, vec3 N, vec3 V, vec3 kd, vec3 ks, float shin)
    {
        vec3 toLight = lPos - vPosW;
        float d = length(toLight);
        if (d < 0.0001) return vec3(0.0);
        vec3 L = toLight / d;

        float nDotL = max(dot(N, L), 0.0);
        vec3 diffuse = kd * nDotL;

        vec3 specular = vec3(0.0);
        if (nDotL > 0.0) {
            vec3 R = reflect(-L, N);
            specular = ks * pow(max(dot(R, V), 0.0), shin);
        }

        // Distance attenuation; 0.1 sets the falloff rate.
        float attenuation = 1.0 / (1.0 + 0.1 * d * d);
        return attenuation * lColor * (diffuse + specular);
    }

    void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(uCameraPos - vPosW);
        vec3 color = uMatAmbient * uMatDiffuse;

        color += shadePointLight(
            uPointLightColor, uPointLightPos, N, V,
            uMatDiffuse, uMatSpecular, uMatShininess
        );

        color += shadePointLight(
            uPointLightColor2, uPointLightPos2, N, V,
            uMatDiffuse, uMatSpecular, uMatShininess
        );

        gl_FragColor = vec4(color, 1.0);
    }`;

    var shaderMat = new BABYLON.ShaderMaterial("custom", scene, "custom", {
        attributes: ["position", "normal"],
        uniforms: [
            "world", "worldViewProjection", "uCameraPos",
            "uMatAmbient", "uMatDiffuse", "uMatSpecular", "uMatShininess",
            "uPointLightColor", "uPointLightPos",
            "uPointLightColor2", "uPointLightPos2"
        ]
    });

    // Material
    shaderMat.setFloat("uMatAmbient", 0.25);
    shaderMat.setColor3("uMatDiffuse", new BABYLON.Color3(0.8, 0.2, 0.2));
    shaderMat.setColor3("uMatSpecular", new BABYLON.Color3(1, 1, 1));
    shaderMat.setFloat("uMatShininess", 32.0);

    // Point light
    shaderMat.setColor3("uPointLightColor", new BABYLON.Color3(0.7, 0.8, 1.0));
    shaderMat.setVector3("uPointLightPos", new BABYLON.Vector3(2.5, 4, -2.0));

    // Second point light; the first light and material retain the Q4(a) defaults.
    shaderMat.setColor3("uPointLightColor2", new BABYLON.Color3(1.0, 0.6, 0.2));
    shaderMat.setVector3("uPointLightPos2", new BABYLON.Vector3(-3, 3, -2));

    scene.onBeforeRenderObservable.add(function () {
        shaderMat.setVector3("uCameraPos", camera.position);
    });

    sphere.material = shaderMat;
    cylinder.material = shaderMat;
    return scene;
};

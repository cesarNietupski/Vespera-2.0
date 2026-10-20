import Phaser from "phaser";
// Subtle vignette preserves the native pixel colours without grain or blur.
export const AURORA_FRAGMENT = `precision mediump float;
uniform sampler2D uMainSampler;
uniform float uStrength;
varying vec2 outTexCoord;
void main(){vec2 uv=outTexCoord;vec4 c=texture2D(uMainSampler,uv);
float v=1.0-smoothstep(.18,.82,distance(uv,vec2(.5)));
c.rgb*=mix(1.0,.65+.35*v,uStrength);/* Native pixel colours stay unblurred and free of per-pixel film grain. */
gl_FragColor=c;}`;
export class AuroraPipeline extends Phaser.Renderer.WebGL.Pipelines
  .PostFXPipeline {
  strength = 0.8;
  constructor(game: Phaser.Game) {
    super({ game, renderTarget: true, fragShader: AURORA_FRAGMENT });
  }
  onPreRender(): void {
    this.set1f("uStrength", this.strength);
  }
}

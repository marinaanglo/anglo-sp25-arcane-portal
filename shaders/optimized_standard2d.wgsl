/* 
 * Copyright (c) 2025 SingChun LEE @ Bucknell University. CC BY-NC 4.0.
 * 
 * This code is provided mainly for educational purposes at Bucknell University.
 *
 * This code is licensed under the Creative Commons Attribution-NonCommerical 4.0
 * International License. To view a copy of the license, visit 
 *   https://creativecommons.org/licenses/by-nc/4.0/
 * or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
 *
 * You are free to:
 *  - Share: copy and redistribute the material in any medium or format.
 *  - Adapt: remix, transform, and build upon the material.
 *
 * Under the following terms:
 *  - Attribution: You must give appropriate credit, provide a link to the license,
 *                 and indicate if changes where made.
 *  - NonCommerical: You may not use the material for commerical purposes.
 *  - No additional restrictions: You may not apply legal terms or technological 
 *                                measures that legally restrict others from doing
 *                                anything the license permits.
 */

var<private> tint_symbol_1_1 : vec2f;

var<private> value = vec4f();

var<private> value_1 = vec4f();

fn tint_symbol_inner(tint_symbol_1 : vec2f) -> vec4f {
  return vec4f(tint_symbol_1.x, tint_symbol_1.y, 0.0f, 1.0f);
}

fn tint_symbol_3() {
  let x_26 = tint_symbol_1_1;
  let x_25 = tint_symbol_inner(x_26);
  value = x_25;
  return;
}

struct tint_symbol_out {
  @builtin(position)
  value_2 : vec4f,
}

@vertex
fn vertexMain(@location(0) tint_symbol_1_1_param : vec2f) -> tint_symbol_out {
  tint_symbol_1_1 = tint_symbol_1_1_param;
  tint_symbol_3();
  return tint_symbol_out(value);
}

fn tint_symbol_2_inner() -> vec4f {
  return vec4f(0.93333333730697631836f, 0.46274510025978088379f, 0.13725490868091583252f, 1.0f);
}

fn tint_symbol_2_1() {
  let x_36 = tint_symbol_2_inner();
  value_1 = x_36;
  return;
}

struct tint_symbol_2_out {
  @location(0)
  value_1_1 : vec4f,
}

@fragment
fn fragmentMain() -> tint_symbol_2_out {
  tint_symbol_2_1();
  return tint_symbol_2_out(value_1);
}

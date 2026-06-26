// Throwaway harness logic: inject identical sample prose into both panels and
// wire the density / rings / theme toggles. Delete with tmp-flow-harness/.

const sample = /* html */ `
  <h1>The vertical rhythm of an article</h1>
  <p>
    Primitiv has solved proportion (the per-density type scale) and density (an
    ambient, inheritable <code>data-density</code> context). What remains is the
    spacing <em>between</em> content blocks.
  </p>
  <p>
    With no default margins, a bare paragraph carries no spacing. Rhythm is opt-in:
    wrap a region in <code>.primitiv-flow</code> and every direct child is spaced.
  </p>
  <h2>A major section break</h2>
  <p>This heading should pull a large amount of leading air above it (region).</p>
  <ul>
    <li>List items use the intra-cluster owl already in the base sheet.</li>
    <li>The list as a whole takes the normal block rhythm.</li>
    <li>Nothing bleeds past the first or last child.</li>
  </ul>
  <blockquote>
    A quote sits in the flow at normal rhythm, with its own inner bar and indent
    preserved from the base sheet.
  </blockquote>
  <h3>A smaller sub-section</h3>
  <p>An <code>h3</code> takes the section step — less air than a region break.</p>
  <pre><code>primitiv add prose
# wraps a region in .primitiv-flow</code></pre>
  <hr />
  <p>After the rule, running text resumes at normal rhythm.</p>
  <dl>
    <dt>Flow</dt>
    <dd>One-directional rhythm on an opt-in container.</dd>
    <dt>Density</dt>
    <dd>The same Context engine scales the rhythm with the page.</dd>
  </dl>
`;

const cardForm = /* html */ `
  <div class="card">
    <h3>Card body</h3>
    <p>Stacked card contents get rhythm from the same flow context.</p>
    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" />
    </div>
    <div class="field">
      <label for="name">Name</label>
      <input id="name" type="text" placeholder="Ada Lovelace" />
    </div>
  </div>
`;

const html = sample + cardForm;
document.getElementById("bare")!.innerHTML = html;
document.getElementById("flow")!.innerHTML = html;

const root = document.getElementById("root")!;
document.getElementById("density")!.addEventListener("change", (e) => {
  root.setAttribute("data-density", (e.target as HTMLSelectElement).value);
});
document.getElementById("rings")!.addEventListener("change", (e) => {
  root.classList.toggle("ring", (e.target as HTMLInputElement).checked);
});
document.getElementById("theme")!.addEventListener("change", (e) => {
  root.setAttribute("data-theme", (e.target as HTMLInputElement).checked ? "dark" : "light");
});

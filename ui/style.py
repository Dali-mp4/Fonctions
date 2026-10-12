"""Shared visual identity for Fonctions."""

import streamlit as st


def apply_styles() -> None:
    st.markdown(
        """<style>
        :root { --fn-violet: #ad95ff; --fn-muted: #aeb8cc; }
        .block-container { padding-top: 2.1rem; padding-bottom: 4rem; max-width: 1220px; }
        html, body, [class*="css"] { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        h1, h2, h3 { letter-spacing: -.035em; }
        .fn-eyebrow { color: #b8a6ff; font-size: .80rem; text-transform: uppercase;
            font-weight: 750; letter-spacing: .15em; margin-bottom: 1rem; }
        .fn-hero { position:relative; overflow:hidden; padding: 3.3rem 2.9rem;
            background: linear-gradient(120deg, #202145 0%, #161e37 60%, #182f40 100%);
            border: 1px solid #343c60; border-radius: 24px; margin-bottom: 1.6rem; }
        .fn-hero::after { content: ""; position:absolute; top:-65px; right:-48px;
            width: 260px; height:260px; border-radius:50%;
            background:radial-gradient(circle,#755eff55 0%,transparent 70%); pointer-events:none; }
        .fn-hero h1 { font-size: clamp(2rem, 4vw, 3.5rem); line-height:1.11;
            font-weight:850; color:#f7f7ff; margin: 0 0 1.15rem; max-width: 810px; }
        .fn-hero h1 em { font-style:normal; color:#bca8ff; }
        .fn-hero p { color:#c3c9dc; font-size:1.05rem; line-height:1.8;
            max-width:720px; margin:0; }
        .fn-pill { display:inline-block; padding:.35rem .77rem; margin-bottom:1.25rem;
            background:#ae93ff24; border:1px solid #ae93ff66; border-radius:99px;
            color:#d3c4ff; font-size:.77rem; font-weight:700; letter-spacing:.04em; }
        .fn-kicker { color:#aeb8cc; font-size:.91rem; }
        .fn-header { margin-bottom:.25rem; font-size:.78rem; letter-spacing:.11em;
            text-transform:uppercase; color:#ac98f7; font-weight:800; }
        .fn-page-title { margin:0 0 .35rem; font-weight:800; line-height:1.1; }
        .fn-accent { color:#c0acff; }
        .fn-sep { border-top:1px solid #31384b; margin:1.5rem 0; }
        .fn-foot { color:#92a0b6; font-size:.76rem; line-height:1.75;
            border-top:1px solid #31384b; margin-top:3rem; padding-top:1.5rem; }
        div[data-testid="stMetric"] { background:#171d30; border:1px solid #343a50;
            border-radius:14px; padding: .8rem 1rem; }
        div[data-testid="stVerticalBlockBorderWrapper"] { border-radius:15px; }
        a { text-decoration: none; }
        @media(max-width:640px) {
          .block-container { padding-top:1.2rem; }
          .fn-hero { padding:2rem 1.35rem; border-radius:18px; }
          .fn-hero h1 { font-size:2.13rem; }
          .fn-hero p { font-size:.95rem; }
        }
        </style>""",
        unsafe_allow_html=True,
    )


def footer() -> None:
    st.markdown(
        '<div class="fn-foot">Algo Fi Jib · Projet éducatif indépendant pour les élèves tunisiens du secondaire. '
        'Collection en évolution — les modules disponibles ne représentent pas l’intégralité '
        'des programmes de 3ème et 4ème Sciences de l’Informatique (7ata ken mekch section info ysl7oulk). Med Ali Tej</div>',
        unsafe_allow_html=True,
    )

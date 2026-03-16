# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e8]
      - heading "Iniciar sesión" [level=3] [ref=e11]
      - paragraph [ref=e12]: Accede a tu cuenta de facturación
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - text: Email
          - textbox "Email" [ref=e16]:
            - /placeholder: tu@email.com
            - text: e2e-1773671416769-grfhvn@test.com
        - generic [ref=e17]:
          - text: Contraseña
          - textbox "Contraseña" [ref=e18]:
            - /placeholder: ••••••••
            - text: e2e-test-password-123
        - button "Iniciar sesión" [ref=e19] [cursor=pointer]
      - paragraph [ref=e20]:
        - text: ¿No tienes cuenta?
        - link "Regístrate" [ref=e21] [cursor=pointer]:
          - /url: /register
```